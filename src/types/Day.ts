/**
 * A specification of when to repeat an activity
 * - date n, no week = nth day of every month
 * - weekday n, no date = every nth day of the week
 * - date n and weekday m = every mth weekday of every month
 * - no date, no weekday = no repeat
 */

/** Every nth day of the month */
export type Monthly = {
	type: 'monthly';
	/** 1-31 */
	date: number;
};

/** Every nth weekday of every week */
export type Weekly = {
	type: 'weekly';
	/** 1-7, Monday through Sunday */
	weekday: number;
};

/** Every nth weekday of every week */
export type Annually = {
	type: 'annually';
	/** 1-12 */
	month: number;
	/** 1-7, Monday through Sunday */
	day: number;
};

/** A concrete date */
export type Day = {
	type: 'date';
	/** 1-31 */
	date: number;
	/** 1-12 */
	month: number;
	/** 2000+ */
	year: number;
};

export function toDate(day: Day) {
	return new Date(day.year, day.month - 1, day.date - 1);
}

export type Weeks = number;

type Repeat = Monthly | Weekly | Annually;

export type { Repeat as default };
