/**
 * A specification of when to repeat an activity
 * - date n, no week = nth day of every month
 * - weekday n, no date = every nth day of the week
 * - date n and weekday m = every mth weekday of every month
 * - no date, no weekday = no repeat
 */

/** Every nth day of the month */
export type MonthDate = {
	type: 'month-date';
	/** 1-31 */
	date: number;
};

/** Every nth weekday of every week */
export type Weekday = {
	type: 'weekday';
	/** 1-7, Monday through Sunday */
	weekday: number;
};

/** Every nth weekday of every week */
export type MonthWeek = {
	type: 'month-week';
	/** 1-5 */
	week: number;
	/** 1-7, Monday through Sunday */
	weekday: number | null;
};

/** A concrete date */
export type Day = {
	/** 1-31 */
	date: number;
	/** 1-12 */
	month: number;
	year: number;
};

export function toDate(day: Day) {
	return new Date(day.year, day.month - 1, day.date - 1);
}

export type Weeks = number;

type Repeat = MonthDate | Weekday | MonthWeek;

export type { Repeat as default };
