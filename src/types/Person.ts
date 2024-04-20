import type { TeamID } from './Organization';

export type PersonID = string;

type Person = {
	/** A unique person identifier */
	id: PersonID;
	/** The person's name */
	name: string;
	/** Their email */
	email: string;
	/** An emoji to represent them */
	icon: string;
	/** The team a person is on */
	team: TeamID;
	/** The person's supervisor. Optional because some leaders will have no supervisor. */
	supervisor: PersonID | null;
};

export type { Person as default };
