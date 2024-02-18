import type Markup from './Markup';
import type { OrganizationID } from './Organization';
import type { PersonID } from './Person';
import type Tracked from './Tracked';

export type RoleID = string;

/** A scope of resopnsibilities, including zero or more processes. */
type Role = Tracked & {
	/** Unique ID for this role. */
	id: RoleID;
	/** The organization the role is in */
	organization: OrganizationID;
	/** A short title for the role */
	title: string;
	/** A descrption of what the scope of responsibilities are. */
	what: Markup;
	/** People who have this role */
	people: PersonID[];
};

export type { Role as default };
