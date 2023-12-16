import type Markup from './Markup';
import type Modification from './Modification';
import type { OrganizationID } from './Organization';
import type { PersonID } from './Person';

export type RoleID = string;

/** A scope of resopnsibilities, including zero or more activities. */
type Role = {
	/** Unique ID for this role. */
	id: RoleID;
	/** The organization the role is in */
	organization: OrganizationID;
	/** A list of modifications to the role */
	modifications: Modification[];
	/** A short title for the role */
	title: string;
	/** A descrption of what the scope of responsibilities are. */
	what: Markup;
	/** An emoji to represent the scope */
	icon: string;
	/** People who have this role */
	people: PersonID[];
	/** Who can view this scope of responsibilities (and comment on it) */
	viewers: PersonID[];
	/** Whether this scope is public to everyone. */
	public: boolean;
};

export type { Role as default };
