import { lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { homes } from '$lib/server/db/schema';
import { lt, and } from 'drizzle-orm';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Validate session
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}
	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}
	event.locals.user = user;
	event.locals.session = session;

	// Background cleanup: delete homes abandoned for 30+ days
	// Run this occasionally, not on every request
	if (Math.random() < 0.01) {
		// 1% of requests
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		await db
			.delete(homes)
			.where(and(lt(homes.lastMemberLeftAt, thirtyDaysAgo)))
			.catch(() => {
				// Silent fail - don't block requests on cleanup errors
			});
	}

	return resolve(event);
};
