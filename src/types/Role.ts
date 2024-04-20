import type Markup from './Markup';
import type { OrganizationID } from './Organization';
import type { StatusID } from './Status';
import type { PersonID } from './Person';
import type Tracked from './Tracked';
import type Visibility from './Visibility';

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
	/** Optional status of this role */
	status: StatusID | null;
	/** Who this is visible to */
	visibility: Visibility;
};

export type { Role as default };
