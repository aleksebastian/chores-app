import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, sessions, homeMemberships } from '$lib/server/db/schema';
import { hashPassword, verifyPassword, validatePassword, lucia } from '$lib/server/auth';
import { eq, and } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Get homes where user is sole owner
	const userMemberships = await db
		.select({
			homeId: homeMemberships.homeId,
			role: homeMemberships.role
		})
		.from(homeMemberships)
		.where(eq(homeMemberships.userId, locals.user.id));

	const soleOwnerHomes = [];
	for (const membership of userMemberships) {
		if (membership.role === 'owner') {
			// Check if there are other owners
			const owners = await db
				.select()
				.from(homeMemberships)
				.where(
					and(
						eq(homeMemberships.homeId, membership.homeId),
						eq(homeMemberships.role, 'owner')
					)
				);

			if (owners.length === 1) {
				soleOwnerHomes.push(membership.homeId);
			}
		}
	}

	return {
		user: locals.user,
		hasSoleOwnerHomes: soleOwnerHomes.length > 0
	};
};

export const actions: Actions = {
	changePassword: async ({ request, locals, cookies }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const currentPassword = data.get('currentPassword')?.toString();
		const newPassword = data.get('newPassword')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { error: 'All fields are required', type: 'password' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'New passwords do not match', type: 'password' });
		}

		// Validate new password
		const passwordValidation = validatePassword(newPassword);
		if (!passwordValidation.valid) {
			return fail(400, { error: passwordValidation.error, type: 'password' });
		}

		// Get user's hashed password
		const [user] = await db.select().from(users).where(eq(users.id, locals.user.id));
		if (!user) {
			return fail(404, { error: 'User not found', type: 'password' });
		}

		// Verify current password
		const validPassword = await verifyPassword(user.hashedPassword, currentPassword);
		if (!validPassword) {
			return fail(400, { error: 'Current password is incorrect', type: 'password' });
		}

		// Update password
		const newHashedPassword = await hashPassword(newPassword);
		await db
			.update(users)
			.set({ hashedPassword: newHashedPassword })
			.where(eq(users.id, locals.user.id));

		// Invalidate all sessions for security
		await db.delete(sessions).where(eq(sessions.userId, locals.user.id));

		// Create new session
		const session = await lucia.createSession(locals.user.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		return { success: true, type: 'password', message: 'Password changed successfully' };
	},

	deleteAccount: async ({ locals }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		// Check if user is sole owner of any homes
		const userMemberships = await db
			.select({
				homeId: homeMemberships.homeId,
				role: homeMemberships.role
			})
			.from(homeMemberships)
			.where(eq(homeMemberships.userId, locals.user.id));

		for (const membership of userMemberships) {
			if (membership.role === 'owner') {
				// Check if there are other owners
				const owners = await db
					.select()
					.from(homeMemberships)
					.where(
						and(
							eq(homeMemberships.homeId, membership.homeId),
							eq(homeMemberships.role, 'owner')
						)
					);

				if (owners.length === 1) {
					return fail(400, {
						error:
							'Cannot delete account. You are the sole owner of one or more homes. Please transfer ownership or delete those homes first.',
						type: 'account'
					});
				}
			}
		}

		// Delete user (cascades to sessions and memberships)
		await db.delete(users).where(eq(users.id, locals.user.id));

		throw redirect(302, '/signup');
	}
};
