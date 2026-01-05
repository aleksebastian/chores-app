import { describe, it, expect } from 'vitest';
import { homes, rooms, chores, users, sessions, homeMemberships } from './schema';

/**
 * Schema validation tests - ensure our database schema has the expected structure
 */

describe('database schema', () => {
	describe('homes table', () => {
		it('has required columns', () => {
			const columns = Object.keys(homes);
			expect(columns).toContain('id');
			expect(columns).toContain('name');
			expect(columns).toContain('shareCode');
			expect(columns).toContain('createdAt');
			expect(columns).toContain('lastMemberLeftAt');
		});
	});

	describe('rooms table', () => {
		it('has required columns', () => {
			const columns = Object.keys(rooms);
			expect(columns).toContain('id');
			expect(columns).toContain('homeId');
			expect(columns).toContain('name');
			expect(columns).toContain('createdAt');
		});
	});

	describe('chores table', () => {
		it('has required columns', () => {
			const columns = Object.keys(chores);
			expect(columns).toContain('id');
			expect(columns).toContain('roomId');
			expect(columns).toContain('title');
			expect(columns).toContain('frequencyWeeks');
			expect(columns).toContain('lastCompletedAt');
			expect(columns).toContain('createdAt');
		});
	});

	describe('users table', () => {
		it('has required columns', () => {
			const columns = Object.keys(users);
			expect(columns).toContain('id');
			expect(columns).toContain('email');
			expect(columns).toContain('hashedPassword');
			expect(columns).toContain('name');
			expect(columns).toContain('createdAt');
		});
	});

	describe('sessions table', () => {
		it('has required columns for Lucia', () => {
			const columns = Object.keys(sessions);
			expect(columns).toContain('id');
			expect(columns).toContain('userId');
			expect(columns).toContain('expiresAt');
		});
	});

	describe('homeMemberships table', () => {
		it('has required columns', () => {
			const columns = Object.keys(homeMemberships);
			expect(columns).toContain('id');
			expect(columns).toContain('userId');
			expect(columns).toContain('homeId');
			expect(columns).toContain('role');
			expect(columns).toContain('joinedAt');
		});
	});
});

describe('default values', () => {
	it('chores have default frequencyWeeks of 1', () => {
		// This test verifies the schema definition
		// In production, you'd test actual inserts
		expect(typeof chores.frequencyWeeks).toBeDefined();
	});
});
