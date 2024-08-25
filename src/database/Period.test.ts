import { expect, test } from 'vitest';
import type Period from './Period';
import { getNextPeriodDate } from './Period';

test.each([
	[new Date(2024, 0, 1), { type: 'annually-date', month: 1, date: 5 }, new Date(2024, 0, 5)],
	[new Date(2024, 0, 6), { type: 'annually-date', month: 1, date: 5 }, new Date(2025, 0, 5)],
	[new Date(2024, 0, 1), { type: 'annually-week', week: 3, day: 2 }, new Date(2024, 0, 16)],
	[new Date(2024, 0, 17), { type: 'annually-week', week: 3, day: 2 }, new Date(2025, 0, 14)],
	[new Date(2024, 0, 1), { type: 'monthly-date', day: 15 }, new Date(2024, 0, 15)],
	[new Date(2024, 1, 16), { type: 'monthly-date', day: 15 }, new Date(2024, 2, 15)],
	[new Date(2024, 0, 1), { type: 'monthly-weekday', week: 3, day: 3 }, new Date(2024, 0, 17)],
	[new Date(2024, 0, 18), { type: 'monthly-weekday', week: 3, day: 3 }, new Date(2024, 1, 21)],
	[new Date(2024, 0, 1), { type: 'weekly', weeks: 1, day: 7 }, new Date(2024, 0, 7)],
	[new Date(2024, 0, 8), { type: 'weekly', weeks: 1, day: 7 }, new Date(2024, 0, 14)]
] as [Date, Period, Date][])(
	'%s + %s should be %s',
	(now: Date, period: Period, expected: Date) => {
		expect(getNextPeriodDate(now.getTime(), period).getTime() === expected.getTime()).toBe(true);
	}
);
