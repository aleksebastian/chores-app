import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { hashPassword, validatePassword, createSession, setSessionCookie } from '$lib/server/auth';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		const rememberMe = data.get('rememberMe') === 'on';

		// Validate inputs
		if (!name || name.trim().length === 0) {
			return fail(400, { error: 'Name is required', email, name });
		}

		if (!email || email.trim().length === 0) {
			return fail(400, { error: 'Email is required', email, name });
		}

		// Basic email validation
		if (!email.includes('@')) {
			return fail(400, { error: 'Invalid email address', email, name });
		}

		if (!password) {
			return fail(400, { error: 'Password is required', email, name });
		}

		// Validate password
		const passwordValidation = validatePassword(password);
		if (!passwordValidation.valid) {
			return fail(400, { error: passwordValidation.error, email, name });
		}

		// Check if email already exists
		const existingUser = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
		if (existingUser.length > 0) {
			return fail(400, { error: 'Email already in use', email, name });
		}

		// Create user
		const hashedPassword = await hashPassword(password);
		const [user] = await db
			.insert(users)
			.values({
				email: email.toLowerCase(),
				hashedPassword,
				name: name.trim()
			})
			.returning();

		// Create session
		const sessionExpiresInMs = rememberMe
			? 1000 * 60 * 60 * 24 * 90 // 90 days
			: 1000 * 60 * 60 * 24 * 30; // 30 days

		const session = await createSession(user.id, sessionExpiresInMs);
		setSessionCookie(cookies, session.id, session.expiresAt);

		throw redirect(302, '/');
	}
};
