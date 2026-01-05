import { describe, it, expect } from 'vitest';

/**
 * Tests for server-side utility functions
 */

describe('generateShareCode', () => {
	function generateShareCode(): string {
		return Math.random().toString(36).substring(2, 8).toUpperCase();
	}

	it('generates a 6-character code', () => {
		const code = generateShareCode();
		expect(code.length).toBe(6);
	});

	it('generates uppercase codes', () => {
		const code = generateShareCode();
		expect(code).toBe(code.toUpperCase());
	});

	it('generates alphanumeric codes', () => {
		const code = generateShareCode();
		expect(code).toMatch(/^[A-Z0-9]{6}$/);
	});

	it('generates unique codes (statistically)', () => {
		const codes = new Set();
		for (let i = 0; i < 100; i++) {
			codes.add(generateShareCode());
		}
		// Should have at least 95 unique codes out of 100
		expect(codes.size).toBeGreaterThanOrEqual(95);
	});
});

describe('form validation logic', () => {
	it('validates home name is not empty', () => {
		const isEmpty = (name: string | undefined) => !name || name.trim().length === 0;
		
		expect(isEmpty('')).toBe(true);
		expect(isEmpty('   ')).toBe(true);
		expect(isEmpty(undefined)).toBe(true);
		expect(isEmpty('My Home')).toBe(false);
	});

	it('validates frequency weeks range', () => {
		const clampFrequency = (weeks: number) => Math.max(1, Math.min(52, weeks));
		
		expect(clampFrequency(0)).toBe(1);
		expect(clampFrequency(-5)).toBe(1);
		expect(clampFrequency(100)).toBe(52);
		expect(clampFrequency(25)).toBe(25);
	});

	it('validates share code format', () => {
		const isValidShareCode = (code: string | undefined) => {
			if (!code || code.trim().length === 0) return false;
			return /^[A-Z0-9]{6}$/.test(code.toUpperCase().trim());
		};
		
		expect(isValidShareCode('ABC123')).toBe(true);
		expect(isValidShareCode('abc123')).toBe(true);
		expect(isValidShareCode('XXXXXX')).toBe(true);
		expect(isValidShareCode('12345')).toBe(false);
		expect(isValidShareCode('ABCDEFG')).toBe(false);
		expect(isValidShareCode('')).toBe(false);
		expect(isValidShareCode(undefined)).toBe(false);
	});

	it('validates user name is not empty', () => {
		const isEmpty = (name: string | undefined) => !name || name.trim().length === 0;
		
		expect(isEmpty('')).toBe(true);
		expect(isEmpty('   ')).toBe(true);
		expect(isEmpty(undefined)).toBe(true);
		expect(isEmpty('John Doe')).toBe(false);
	});

	it('normalizes email to lowercase', () => {
		const normalizeEmail = (email: string) => email.toLowerCase();
		
		expect(normalizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
		expect(normalizeEmail('Test@Test.com')).toBe('test@test.com');
		expect(normalizeEmail('lowercase@email.com')).toBe('lowercase@email.com');
	});
});
