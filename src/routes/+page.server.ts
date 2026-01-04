import { db } from '$lib/server/db';
import { homes } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const homeId = cookies.get('homeId');
	
	if (homeId) {
		// User already has a home, redirect to dashboard
		throw redirect(302, '/home');
	}
	
	return {};
};

function generateShareCode(): string {
	return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const actions: Actions = {
	createHome: async ({ request, cookies }) => {
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

		const [home] = await db.insert(homes).values({
			name: name.trim(),
			shareCode
		}).returning();

		// Set cookie with home ID
		cookies.set('homeId', home.id, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365, // 1 year
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax'
		});

		throw redirect(303, '/home');
	},

	joinHome: async ({ request, cookies }) => {
		const data = await request.formData();
		const shareCode = data.get('shareCode')?.toString()?.toUpperCase();

		if (!shareCode || shareCode.trim().length === 0) {
			return fail(400, { error: 'Share code is required' });
		}

		const [home] = await db.select().from(homes).where(eq(homes.shareCode, shareCode.trim()));

		if (!home) {
			return fail(404, { error: 'Home not found with that share code' });
		}

		// Set cookie with home ID
		cookies.set('homeId', home.id, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365, // 1 year
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax'
		});

		throw redirect(303, '/home');
	}
};
