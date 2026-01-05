import { db } from '$lib/server/db';
import { homes, homeMemberships } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Not authenticated - redirect to login (preserve code param)
	if (!locals.user) {
		const code = url.searchParams.get('code');
		if (code) {
			throw redirect(302, `/login?redirect=${encodeURIComponent(`/?code=${code}`)}`);
		}
		throw redirect(302, '/login');
	}

	// Check for share code in URL
	const shareCode = url.searchParams.get('code');
	if (shareCode) {
		// Try to join home with this code
		const [home] = await db.select().from(homes).where(eq(homes.shareCode, shareCode.toUpperCase()));
		
		if (home) {
			// Check if user is already a member
			const existingMembership = await db
				.select()
				.from(homeMemberships)
				.where(and(
					eq(homeMemberships.userId, locals.user.id),
					eq(homeMemberships.homeId, home.id)
				));

			if (existingMembership.length > 0) {
				// Already a member, just redirect
				throw redirect(302, `/home/${home.id}`);
			}

			// Add as member and redirect (handled by joinHome action)
			// For now, just pass the code to the page to auto-fill
		}
	}

	// Get user's homes
	const userHomes = await db
		.select({
			id: homes.id,
			name: homes.name,
			shareCode: homes.shareCode,
			role: homeMemberships.role
		})
		.from(homeMemberships)
		.innerJoin(homes, eq(homeMemberships.homeId, homes.id))
		.where(eq(homeMemberships.userId, locals.user.id));

	// If user has exactly one home, redirect to it
	if (userHomes.length === 1 && !shareCode) {
		throw redirect(302, `/home/${userHomes[0].id}`);
	}

	// Return homes for selection
	return {
		homes: userHomes,
		shareCode: shareCode || undefined
	};
};

function generateShareCode(): string {
	return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const actions: Actions = {
	createHome: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const name = data.get('name')?.toString();

		if (!name || name.trim().length === 0) {
			return fail(400, { error: 'Home name is required' });
		}

		// Generate unique share code
		let shareCode = generateShareCode();
		let attempts = 0;
		while (attempts < 10) {
			const existing = await db.select().from(homes).where(eq(homes.shareCode, shareCode));
			if (existing.length === 0) break;
			shareCode = generateShareCode();
			attempts++;
		}

		// Create home
		const [home] = await db
			.insert(homes)
			.values({
				name: name.trim(),
				shareCode,
				lastMemberLeftAt: null
			})
			.returning();

		// Add user as owner
		await db.insert(homeMemberships).values({
			userId: locals.user.id,
			homeId: home.id,
			role: 'owner'
		});

		throw redirect(303, `/home/${home.id}`);
	},

	joinHome: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const shareCode = data.get('shareCode')?.toString()?.toUpperCase();

		if (!shareCode || shareCode.trim().length === 0) {
			return fail(400, { error: 'Share code is required' });
		}

		const [home] = await db.select().from(homes).where(eq(homes.shareCode, shareCode.trim()));

		if (!home) {
			return fail(404, { error: 'Home not found with that share code' });
		}

		// Check if user is already a member
		const existingMembership = await db
			.select()
			.from(homeMemberships)
			.where(and(
				eq(homeMemberships.userId, locals.user.id),
				eq(homeMemberships.homeId, home.id)
			));

		if (existingMembership.length > 0) {
			throw redirect(303, `/home/${home.id}`);
		}

		// Check if home has any members (orphaned home)
		const existingMembers = await db
			.select()
			.from(homeMemberships)
			.where(eq(homeMemberships.homeId, home.id));

		const role = existingMembers.length === 0 ? 'owner' : 'member';

		// Add user as member (or owner if orphaned)
		await db.insert(homeMemberships).values({
			userId: locals.user.id,
			homeId: home.id,
			role
		});

		// Clear lastMemberLeftAt since someone joined
		await db.update(homes).set({ lastMemberLeftAt: null }).where(eq(homes.id, home.id));

		throw redirect(303, `/home/${home.id}`);
	}
};
