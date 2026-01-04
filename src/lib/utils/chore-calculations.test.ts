import { describe, it, expect } from 'vitest';

/**
 * These functions are extracted from +page.svelte for testing.
 * In a real refactor, you'd move these to a shared utils file.
 */

function calculateProgress(chore: {
	lastCompletedAt: Date | null;
	frequencyWeeks: number;
}): number {
	if (!chore.lastCompletedAt) return 100; // Never completed, show as urgent

	const now = Date.now();
	const lastCompleted = new Date(chore.lastCompletedAt).getTime();
	const daysSince = (now - lastCompleted) / (1000 * 60 * 60 * 24);
	const totalDays = chore.frequencyWeeks * 7;
	const progress = (daysSince / totalDays) * 100;

	return Math.min(100, Math.max(0, progress));
}

function getDaysUntilDue(chore: {
	lastCompletedAt: Date | null;
	frequencyWeeks: number;
}): string {
	if (!chore.lastCompletedAt) return 'Never completed';

	const now = Date.now();
	const lastCompleted = new Date(chore.lastCompletedAt).getTime();
	const daysSince = (now - lastCompleted) / (1000 * 60 * 60 * 24);
	const totalDays = chore.frequencyWeeks * 7;
	const daysUntilDue = Math.ceil(totalDays - daysSince);

	if (daysUntilDue <= 0) return 'Overdue!';
	if (daysUntilDue === 1) return 'Due tomorrow';
	return `Due in ${daysUntilDue} days`;
}

describe('calculateProgress', () => {
	it('returns 100 for never completed chores', () => {
		const chore = {
			lastCompletedAt: null,
			frequencyWeeks: 1
		};
		expect(calculateProgress(chore)).toBe(100);
	});

	it('returns 0 for just completed chores', () => {
		const chore = {
			lastCompletedAt: new Date(),
			frequencyWeeks: 1
		};
		expect(calculateProgress(chore)).toBe(0);
	});

	it('returns ~50 for chores at halfway point', () => {
		const threeDaysAgo = new Date();
		threeDaysAgo.setDate(threeDaysAgo.getDate() - 3.5);
		
		const chore = {
			lastCompletedAt: threeDaysAgo,
			frequencyWeeks: 1 // 7 days total
		};
		
		const progress = calculateProgress(chore);
		expect(progress).toBeGreaterThan(40);
		expect(progress).toBeLessThan(60);
	});

	it('returns 100 for overdue chores', () => {
		const twoWeeksAgo = new Date();
		twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
		
		const chore = {
			lastCompletedAt: twoWeeksAgo,
			frequencyWeeks: 1
		};
		
		expect(calculateProgress(chore)).toBe(100);
	});

	it('calculates correctly for multi-week frequencies', () => {
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
		
		const chore = {
			lastCompletedAt: oneWeekAgo,
			frequencyWeeks: 2 // 14 days total
		};
		
		const progress = calculateProgress(chore);
		expect(progress).toBeGreaterThan(45);
		expect(progress).toBeLessThan(55);
	});

	it('never returns negative progress', () => {
		const future = new Date();
		future.setDate(future.getDate() + 7);
		
		const chore = {
			lastCompletedAt: future,
			frequencyWeeks: 1
		};
		
		expect(calculateProgress(chore)).toBeGreaterThanOrEqual(0);
	});
});

describe('getDaysUntilDue', () => {
	it('returns "Never completed" for chores without completion date', () => {
		const chore = {
			lastCompletedAt: null,
			frequencyWeeks: 1
		};
		expect(getDaysUntilDue(chore)).toBe('Never completed');
	});

	it('returns "Overdue!" for past due chores', () => {
		const twoWeeksAgo = new Date();
		twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
		
		const chore = {
			lastCompletedAt: twoWeeksAgo,
			frequencyWeeks: 1
		};
		
		expect(getDaysUntilDue(chore)).toBe('Overdue!');
	});

	it('returns "Due tomorrow" when 1 day remaining', () => {
		const sixDaysAgo = new Date();
		sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
		
		const chore = {
			lastCompletedAt: sixDaysAgo,
			frequencyWeeks: 1
		};
		
		expect(getDaysUntilDue(chore)).toBe('Due tomorrow');
	});

	it('returns correct days for future due dates', () => {
		const twoDaysAgo = new Date();
		twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
		
		const chore = {
			lastCompletedAt: twoDaysAgo,
			frequencyWeeks: 1 // Due in 5 days
		};
		
		const result = getDaysUntilDue(chore);
		expect(result).toMatch(/Due in \d+ days/);
	});

	it('handles multi-week frequencies correctly', () => {
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
		
		const chore = {
			lastCompletedAt: sevenDaysAgo,
			frequencyWeeks: 2 // Due in 7 days
		};
		
		const result = getDaysUntilDue(chore);
		expect(result).toMatch(/Due in [6-8] days/);
	});
});

describe('getProgressColor', () => {
	function getProgressColor(progress: number): string {
		if (progress < 50) return 'bg-green-500';
		if (progress < 80) return 'bg-yellow-500';
		return 'bg-red-500';
	}

	it('returns green for progress below 50%', () => {
		expect(getProgressColor(0)).toBe('bg-green-500');
		expect(getProgressColor(25)).toBe('bg-green-500');
		expect(getProgressColor(49)).toBe('bg-green-500');
	});

	it('returns yellow for progress 50-79%', () => {
		expect(getProgressColor(50)).toBe('bg-yellow-500');
		expect(getProgressColor(65)).toBe('bg-yellow-500');
		expect(getProgressColor(79)).toBe('bg-yellow-500');
	});

	it('returns red for progress 80% and above', () => {
		expect(getProgressColor(80)).toBe('bg-red-500');
		expect(getProgressColor(95)).toBe('bg-red-500');
		expect(getProgressColor(100)).toBe('bg-red-500');
	});
});
