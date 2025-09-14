import { addDays, addWeeks, format, getDay, getWeek } from 'date-fns';
import type { ProcessRow } from './Organization';

/** e.g., Every March 1st. Month 1-12, date 1-31 */
export type AnnualDate = { type: 'annually-date'; month: number; date: number };
/** e.g., Every 13th week on Monday. Week 1-52, day 1-7 */
export type AnnuallyWeek = { type: 'annually-week'; week: number; day: number };
/** e.g., Every 1st of the month. Day 1-31 */
export type MonthlyDate = { type: 'monthly-date'; day: number };
/** e.g., The 2nd Monday of each month. Week 1-5, day: 1-7, Monday = 1 */
export type MonthlyWeekday = { type: 'monthly-weekday'; week: number; day: number };
/** e.g., Every 2 weeks on Monday, from the first week of the calendar year. Weeks 1+, day: 1-7, Monday = 1  */
export type Weekly = { type: 'weekly'; weeks: number; day: number };
/** One of the above types of periods */
type Period = AnnualDate | AnnuallyWeek | MonthlyDate | MonthlyWeekday | Weekly;

/** Given a timestamp and a period, find the next date in the period */
export function getNextPeriodDate(timestamp: number, period: Period): Date {
	const date = new Date(timestamp);
	switch (period.type) {
		case 'annually-date':
			// Before the date? Choose this year's date. Otherwise, choose next year's date.
			return date.getMonth() < period.month - 1 ||
				(date.getMonth() === period.month - 1 && date.getDate() <= period.date)
				? new Date(date.getFullYear(), period.month - 1, period.date)
				: new Date(date.getFullYear() + 1, period.month - 1, period.date);
		case 'annually-week': {
			// Increment through days until we find the desired week and day.
			let nextDate: Date = date;
			do {
				const yearWeek = getWeek(nextDate, { weekStartsOn: 1 });
				const weekDay = getDay(nextDate);
				// Note that the day of weeks in the library starts at 0 on Sunday, but we number starting on Monday at 1, so no conversion is needed.
				if (yearWeek === period.week && weekDay === period.day - 1) break;
				else nextDate = addDays(nextDate, 1);
			} while (nextDate);
			return nextDate;
		}
		case 'monthly-date':
			// Before this month's date? Choose this month's date. Otherwise, choose next month's date.
			return date.getDate() <= period.day
				? new Date(date.getFullYear(), date.getMonth(), period.day)
				: new Date(date.getFullYear(), date.getMonth() + 1, period.day);
		case 'monthly-weekday': {
			// Find the first preferred day of the current month.
			let nextDate = new Date(date.getFullYear(), date.getMonth(), 1);
			const day = getDay(nextDate);
			// Adjust to the preferred day.
			nextDate = addDays(nextDate, (period.day % 7) - day);
			// Add the preferred weeks, minus one to account for the first week.
			nextDate = addWeeks(nextDate, period.week - 1);
			// If we are before the current date, it has passed, so we choose the next one.
			if (nextDate.getTime() < date.getTime()) {
				// Jump to the first of the next month.
				let nextDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
				const day = getDay(nextDate);
				// Adjust to the first preferred day of the month.
				nextDate = addDays(nextDate, period.day < day ? 7 - (day - period.day) : day - period.day);
				// Add the preferred weeks, minus one to account for the first week.
				nextDate = addWeeks(nextDate, period.week - 1);
				return nextDate;
			}
			return nextDate;
		}
		case 'weekly': {
			// Start with the first preferred day of the week in the year.
			let nextDate = new Date(date.getFullYear(), 0, 1);
			const day = getDay(nextDate);
			// Adjust to the preferred day.
			nextDate = addDays(nextDate, (period.day % 7) - day);
			// Add the preferred weeks until we find a date after today.
			do {
				nextDate = addWeeks(nextDate, period.weeks);
				if (nextDate.getTime() > date.getTime()) break;
			} while (nextDate);
			// Keep adding the number of weeks until we find a date after today.
			return nextDate;
		}
	}
}

export function sortProcessesByNextDate(processes: ProcessRow[]): ProcessRow[] {
	return processes.toSorted((a, b) => {
		const aRepeat = a.repeat;
		const bRepeat = b.repeat;
		if (aRepeat.length === 0) {
			if (bRepeat.length === 0) return a.title.localeCompare(b.title);
			else return 1;
		} else {
			if (bRepeat.length === 0) return -1;
			else {
				return (
					Math.min.apply(
						aRepeat.map((period) => getNextPeriodDate(new Date().getTime(), period).getTime())
					) -
					Math.min.apply(
						bRepeat.map((period) => getNextPeriodDate(new Date().getTime(), period).getTime())
					)
				);
			}
		}
	});
}

export function getNextProcessDate(process: ProcessRow): Date | undefined {
	return process.repeat
		.map((period) => getNextPeriodDate(Date.now(), period))
		.toSorted((a, b) => a.getTime() - b.getTime())[0];
}

export function formatNextDate(date: Date) {
	return format(date, 'MMMM dd, yyy');
}

export type { Period as default };
