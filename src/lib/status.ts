export const Statuses = {
	triage: 'Triage',
	backlog: 'Backlog',
	active: 'Active',
	blocked: 'Blocked',
	done: 'Done',
	declined: 'Declined'
} as const;

export type StatusType = keyof typeof Statuses;

export const isStatus = (x: string): x is StatusType => x in Statuses;
