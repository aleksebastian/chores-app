import { db } from './db';
import { sessions, users } from './db/schema';
import { dev } from '$app/environment';
import { eq } from 'drizzle-orm';
import { hash, verify } from '@node-rs/argon2';
import type { Cookies } from '@sveltejs/kit';

export const SESSION_COOKIE_NAME = 'auth_session';
const SESSION_EXPIRES_IN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_RENEW_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000; // renew when < 15 days remain

export interface Session {
	id: string;
	userId: string;
	expiresAt: Date;
	fresh: boolean;
}

export interface User {
	id: string;
	email: string;
	name: string;
}

function generateSessionId(): string {
	const bytes = new Uint8Array(25);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(
	userId: string,
	expiresInMs = SESSION_EXPIRES_IN_MS
): Promise<Session> {
	const id = generateSessionId();
	const expiresAt = new Date(Date.now() + expiresInMs);
	await db.insert(sessions).values({
		id,
		userId,
		expiresAt: Math.floor(expiresAt.getTime() / 1000)
	});
	return { id, userId, expiresAt, fresh: false };
}

export async function validateSession(
	sessionId: string
): Promise<{ session: Session; user: User } | { session: null; user: null }> {
	const result = await db
		.select({ session: sessions, user: users })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId));

	if (result.length === 0) return { session: null, user: null };

	const { session: sessionRow, user: userRow } = result[0];
	const expiresAt = new Date(sessionRow.expiresAt * 1000);
	const now = Date.now();

	if (now >= expiresAt.getTime()) {
		await db.delete(sessions).where(eq(sessions.id, sessionId));
		return { session: null, user: null };
	}

	let fresh = false;
	if (expiresAt.getTime() - now < SESSION_RENEW_THRESHOLD_MS) {
		const newExpiresAt = new Date(now + SESSION_EXPIRES_IN_MS);
		await db
			.update(sessions)
			.set({ expiresAt: Math.floor(newExpiresAt.getTime() / 1000) })
			.where(eq(sessions.id, sessionId));
		expiresAt.setTime(newExpiresAt.getTime());
		fresh = true;
	}

	return {
		session: { id: sessionRow.id, userId: sessionRow.userId, expiresAt, fresh },
		user: { id: userRow.id, email: userRow.email, name: userRow.name }
	};
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export function setSessionCookie(cookies: Cookies, sessionId: string, expiresAt: Date): void {
	cookies.set(SESSION_COOKIE_NAME, sessionId, {
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/',
		secure: !dev
	});
}

export function deleteSessionCookie(cookies: Cookies): void {
	cookies.set(SESSION_COOKIE_NAME, '', {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 0,
		path: '/',
		secure: !dev
	});
}

// Password validation and hashing utilities
export function validatePassword(password: string): { valid: boolean; error?: string } {
	if (password.length < 8) {
		return { valid: false, error: 'Password must be at least 8 characters' };
	}
	if (password.length > 52) {
		return { valid: false, error: 'Password must be at most 52 characters' };
	}
	return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
	return await hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
	return await verify(hash, password);
}
