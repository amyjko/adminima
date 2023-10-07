export type MonthDate = {
	type: 'm-date';
	month: number;
	date: number;
};

export type YearDay = {
	type: 'y-day';
	day: number;
};

export type MonthDay = {
	type: 'm-day';
	day: number;
};

export type Weeks = number;

type Moment = MonthDate | YearDay | MonthDay;

export default Moment;
