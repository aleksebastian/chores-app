import { describe, it, expect } from 'vitest';
import { validatePassword, hashPassword, verifyPassword } from './auth';

/**
 * Authentication utility tests
 */

describe('password validation', () => {
	it('rejects passwords shorter than 8 characters', () => {
		const result = validatePassword('short');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('at least 8');
	});

	it('rejects passwords longer than 52 characters', () => {
		const longPassword = 'a'.repeat(53);
		const result = validatePassword(longPassword);
		expect(result.valid).toBe(false);
		expect(result.error).toContain('at most 52');
	});

	it('accepts passwords between 8 and 52 characters', () => {
		const validPasswords = ['password', 'myP@ssw0rd!', 'a'.repeat(8), 'a'.repeat(52)];

		validPasswords.forEach((pwd) => {
			const result = validatePassword(pwd);
			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});
	});

	it('validates edge cases', () => {
		expect(validatePassword('1234567').valid).toBe(false); // 7 chars
		expect(validatePassword('12345678').valid).toBe(true); // 8 chars
		expect(validatePassword('a'.repeat(52)).valid).toBe(true); // 52 chars
		expect(validatePassword('a'.repeat(53)).valid).toBe(false); // 53 chars
	});
});

describe('password hashing', () => {
	it('hashes a password', async () => {
		const password = 'mySecurePassword123';
		const hash = await hashPassword(password);

		expect(hash).toBeDefined();
		expect(hash.length).toBeGreaterThan(0);
		expect(hash).not.toBe(password);
	});

	it('produces different hashes for the same password', async () => {
		const password = 'samePassword';
		const hash1 = await hashPassword(password);
		const hash2 = await hashPassword(password);

		// Argon2 should produce different salts
		expect(hash1).not.toBe(hash2);
	});

	it('hashes contain Argon2 identifier', async () => {
		const password = 'testPassword';
		const hash = await hashPassword(password);

		// Argon2 hashes start with $argon2
		expect(hash).toMatch(/^\$argon2/);
	});
});

describe('password verification', () => {
	it('verifies correct password', async () => {
		const password = 'correctPassword123';
		const hash = await hashPassword(password);

		const isValid = await verifyPassword(hash, password);
		expect(isValid).toBe(true);
	});

	it('rejects incorrect password', async () => {
		const password = 'correctPassword';
		const wrongPassword = 'wrongPassword';
		const hash = await hashPassword(password);

		const isValid = await verifyPassword(hash, wrongPassword);
		expect(isValid).toBe(false);
	});

	it('rejects empty password', async () => {
		const password = 'correctPassword';
		const hash = await hashPassword(password);

		const isValid = await verifyPassword(hash, '');
		expect(isValid).toBe(false);
	});

	it('is case-sensitive', async () => {
		const password = 'CaseSensitive';
		const hash = await hashPassword(password);

		expect(await verifyPassword(hash, password)).toBe(true);
		expect(await verifyPassword(hash, 'casesensitive')).toBe(false);
		expect(await verifyPassword(hash, 'CASESENSITIVE')).toBe(false);
	});
});

describe('email validation patterns', () => {
	const isValidEmail = (email: string | undefined) => {
		if (!email || email.trim().length === 0) return false;
		return email.includes('@');
	};

	it('validates basic email format', () => {
		expect(isValidEmail('user@example.com')).toBe(true);
		expect(isValidEmail('test@test.org')).toBe(true);
		expect(isValidEmail('email@domain.co.uk')).toBe(true);
	});

	it('rejects invalid emails', () => {
		expect(isValidEmail('notanemail')).toBe(false);
		expect(isValidEmail('missing.at.sign.com')).toBe(false);
		expect(isValidEmail('')).toBe(false);
		expect(isValidEmail(undefined)).toBe(false);
		expect(isValidEmail('   ')).toBe(false);
	});
});

describe('session expiry calculation', () => {
	const calculateSessionExpiry = (rememberMe: boolean) => {
		return rememberMe
			? 1000 * 60 * 60 * 24 * 90 // 90 days
			: 1000 * 60 * 60 * 24 * 30; // 30 days
	};

	it('returns 30 days for default session', () => {
		const expiry = calculateSessionExpiry(false);
		const days = expiry / (1000 * 60 * 60 * 24);
		expect(days).toBe(30);
	});

	it('returns 90 days for remember me session', () => {
		const expiry = calculateSessionExpiry(true);
		const days = expiry / (1000 * 60 * 60 * 24);
		expect(days).toBe(90);
	});
});

describe('role-based permissions', () => {
	type Role = 'owner' | 'member';

	const canManageMembers = (role: Role) => role === 'owner';
	const canDeleteHome = (role: Role) => role === 'owner';
	const canLeaveHome = (role: Role, isSoleOwner: boolean) => {
		if (role === 'owner' && isSoleOwner) return false;
		return true;
	};

	it('owners can manage members', () => {
		expect(canManageMembers('owner')).toBe(true);
		expect(canManageMembers('member')).toBe(false);
	});

	it('owners can delete homes', () => {
		expect(canDeleteHome('owner')).toBe(true);
		expect(canDeleteHome('member')).toBe(false);
	});

	it('members can leave homes', () => {
		expect(canLeaveHome('member', false)).toBe(true);
	});

	it('sole owners cannot leave homes', () => {
		expect(canLeaveHome('owner', true)).toBe(false);
	});

	it('co-owners can leave homes', () => {
		expect(canLeaveHome('owner', false)).toBe(true);
	});
});

describe('home cleanup logic', () => {
	const shouldCleanupHome = (lastMemberLeftAt: Date | null, daysThreshold: number) => {
		if (!lastMemberLeftAt) return false;
		const daysSinceLeft = (Date.now() - lastMemberLeftAt.getTime()) / (1000 * 60 * 60 * 24);
		return daysSinceLeft > daysThreshold;
	};

	it('does not cleanup homes with members', () => {
		expect(shouldCleanupHome(null, 30)).toBe(false);
	});

	it('does not cleanup homes abandoned recently', () => {
		const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
		expect(shouldCleanupHome(yesterday, 30)).toBe(false);
	});

	it('cleans up homes abandoned over threshold', () => {
		const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
		expect(shouldCleanupHome(fortyDaysAgo, 30)).toBe(true);
	});

	it('does not cleanup at exactly threshold', () => {
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		expect(shouldCleanupHome(thirtyDaysAgo, 30)).toBe(false);
	});
});
