import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { verifyPassword, lucia } from '$lib/server/auth';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		const redirectTo = url.searchParams.get('redirect');
		throw redirect(302, redirectTo || '/');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		const rememberMe = data.get('rememberMe') === 'on';

		// Validate inputs
		if (!email || email.trim().length === 0) {
			return fail(400, { error: 'Email is required', email });
		}

		if (!password) {
			return fail(400, { error: 'Password is required', email });
		}

		// Find user
		const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
		if (!user) {
			return fail(400, { error: 'Invalid email or password', email });
		}

		// Verify password
		const validPassword = await verifyPassword(user.hashedPassword, password);
		if (!validPassword) {
			return fail(400, { error: 'Invalid email or password', email });
		}

		// Create session
		const sessionExpiry = rememberMe
			? 1000 * 60 * 60 * 24 * 90 // 90 days
			: 1000 * 60 * 60 * 24 * 30; // 30 days

		const session = await lucia.createSession(user.id, {}, { sessionId: undefined });
		const sessionCookie = lucia.createSessionCookie(session.id);

		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			maxAge: sessionExpiry / 1000,
			...sessionCookie.attributes
		});

		const redirectTo = url.searchParams.get('redirect');
		throw redirect(302, redirectTo || '/');
	}
};
