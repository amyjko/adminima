import type Markup from './Markup';
import type { OrganizationID } from './Organization';

export type PersonID = string;

type Person = {
	/** A unique person identifier */
	id: PersonID;
	/** The organization this person is in */
	organization: OrganizationID;
	/** The person's name */
	name: string;
	/** The person's self-introduction to everyone in the org */
	bio: Markup;
	/** Their email */
	email: string;
	/** The person's supervisor. Optional because some leaders will have no supervisor. */
	supervisor: PersonID | null;
	/** Whether the person is an admin in the organization */
	admin: boolean;
};

export type { Person as default };
