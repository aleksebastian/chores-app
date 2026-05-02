import {
	SESSION_COOKIE_NAME,
	validateSession,
	setSessionCookie,
	deleteSessionCookie
} from '$lib/server/auth';
import { db } from '$lib/server/db';
import { homes } from '$lib/server/db/schema';
import { lt, and } from 'drizzle-orm';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Validate session
	const sessionId = event.cookies.get(SESSION_COOKIE_NAME);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await validateSession(sessionId);
	if (session && session.fresh) {
		setSessionCookie(event.cookies, session.id, session.expiresAt);
	}
	if (!session) {
		deleteSessionCookie(event.cookies);
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
