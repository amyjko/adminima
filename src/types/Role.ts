import type Markup from './Markup';
import type { OrganizationID } from './Organization';
import type { PersonID } from './Person';

/** A scope of resopnsibilities, including zero or more activities. */
type Role = {
	/** Unique ID for this role. */
	id: string;
	/** The organization the role is in */
	organization: OrganizationID;
	/** A short title for the role */
	title: string;
	/** A descrption of what the scope of responsibilities are. */
	what: Markup;
	/** An emoji to represent the scope */
	icon: string;
	/** Who manages this scope of responsibilities (and can edit it). */
	managers: PersonID[];
	/** Who can view this scope of responsibilities (and comment on it) */
	viewers: PersonID[];
	/** Whether this scope is public to everyone. */
	public: boolean;
};

export default Role;
