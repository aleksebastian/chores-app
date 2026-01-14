import { db } from '$lib/server/db';
import { homes, homeMemberships, users } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const homeId = params.homeId;

	// Verify user has access to this home
	const [membership] = await db
		.select()
		.from(homeMemberships)
		.where(and(eq(homeMemberships.userId, locals.user.id), eq(homeMemberships.homeId, homeId)));

	if (!membership) {
		throw redirect(302, '/');
	}

	// Fetch home
	const [home] = await db.select().from(homes).where(eq(homes.id, homeId));

	if (!home) {
		throw redirect(302, '/');
	}

	// Fetch all members of this home
	const members = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: homeMemberships.role
		})
		.from(homeMemberships)
		.innerJoin(users, eq(homeMemberships.userId, users.id))
		.where(eq(homeMemberships.homeId, homeId));

	return {
		home,
		userRole: membership.role,
		members,
		userId: locals.user.id
	};
};

export const actions: Actions = {
	leaveHome: async ({ locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');
		const homeId = params.homeId;

		const [membership] = await db
			.select()
			.from(homeMemberships)
			.where(and(eq(homeMemberships.userId, locals.user.id), eq(homeMemberships.homeId, homeId)));
		if (!membership) return fail(403, { error: 'Unauthorized' });

		// Check if user is the sole owner
		const owners = await db
			.select()
			.from(homeMemberships)
			.where(and(eq(homeMemberships.homeId, homeId), eq(homeMemberships.role, 'owner')));

		if (membership.role === 'owner' && owners.length === 1) {
			return fail(400, {
				error: 'Cannot leave home as sole owner. Transfer ownership or delete the home first.'
			});
		}

		// Remove membership
		await db
			.delete(homeMemberships)
			.where(
				and(eq(homeMemberships.userId, locals.user.id), eq(homeMemberships.homeId, homeId))
			);

		// Check if home has any members left
		const remainingMembers = await db
			.select()
			.from(homeMemberships)
			.where(eq(homeMemberships.homeId, homeId));

		if (remainingMembers.length === 0) {
			// Set lastMemberLeftAt for cleanup
			await db.update(homes).set({ lastMemberLeftAt: new Date() }).where(eq(homes.id, homeId));
		}

		throw redirect(303, '/');
	},

	promoteMember: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');
		const homeId = params.homeId;

		const [membership] = await db
			.select()
			.from(homeMemberships)
			.where(and(eq(homeMemberships.userId, locals.user.id), eq(homeMemberships.homeId, homeId)));
		if (!membership || membership.role !== 'owner') {
			return fail(403, { error: 'Only owners can promote members' });
		}

		const data = await request.formData();
		const targetUserId = data.get('userId')?.toString();

		if (!targetUserId) {
			return fail(400, { error: 'User ID is required' });
		}

		// Verify target user is a member
		const [targetMembership] = await db
			.select()
			.from(homeMemberships)
			.where(and(eq(homeMemberships.userId, targetUserId), eq(homeMemberships.homeId, homeId)));

		if (!targetMembership) {
			return fail(404, { error: 'User not found in this home' });
		}

		// Promote to owner
		await db
			.update(homeMemberships)
			.set({ role: 'owner' })
			.where(
				and(eq(homeMemberships.userId, targetUserId), eq(homeMemberships.homeId, homeId))
			);

		return { success: true };
	},

	removeMember: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');
		const homeId = params.homeId;

		const [membership] = await db
			.select()
			.from(homeMemberships)
			.where(and(eq(homeMemberships.userId, locals.user.id), eq(homeMemberships.homeId, homeId)));
		if (!membership || membership.role !== 'owner') {
			return fail(403, { error: 'Only owners can remove members' });
		}

		const data = await request.formData();
		const targetUserId = data.get('userId')?.toString();

		if (!targetUserId) {
			return fail(400, { error: 'User ID is required' });
		}

		if (targetUserId === locals.user.id) {
			return fail(400, { error: 'Cannot remove yourself. Use leave home instead.' });
		}

		// Remove member
		await db
			.delete(homeMemberships)
			.where(and(eq(homeMemberships.userId, targetUserId), eq(homeMemberships.homeId, homeId)));

		return { success: true };
	},

	deleteHome: async ({ locals, params }) => {
		if (!locals.user) throw redirect(302, '/login');
		const homeId = params.homeId;

		const [membership] = await db
			.select()
			.from(homeMemberships)
			.where(and(eq(homeMemberships.userId, locals.user.id), eq(homeMemberships.homeId, homeId)));
		if (!membership || membership.role !== 'owner') {
			return fail(403, { error: 'Only owners can delete the home' });
		}

		// Delete home (cascades to rooms, chores, and memberships)
		await db.delete(homes).where(eq(homes.id, homeId));

		throw redirect(303, '/');
	}
};
