import type { OrganizationID } from './Organization';

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
	/** Organizations the person is in */
	organizations: OrganizationID[];
};

export type { Person as default };
