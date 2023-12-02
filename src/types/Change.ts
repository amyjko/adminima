import type { ActivityID } from './Activity';
import type Markup from './Markup';
import type { OrganizationID } from './Organization';
import type { PersonID } from './Person';
import type { RoleID } from './Role';

type Idea = {
	/** Unix time of when it was created */
	created: number;
	/** Optional creator of the idea */
	creator: PersonID | null;
	/** A description of the idea and its tradeoffs */
	description: Markup;
};

/** A change request. */
type Change = {
	/** Unique ID for this change request. */
	id: string;
	/** A unix timestamp of when it was created */
	created: number;
	/** The optional person who created this change, null if anonymous. */
	creator: PersonID | null;
	/** A unix timestamp of when it was modified */
	modified: number;
	/** Who last modified it */
	modifier: PersonID;
	/** The organization the change was requested for */
	organization: OrganizationID;
	/** Roles affected by this request */
	roles: RoleID[];
	/** Activities affected by this request */
	activities: ActivityID[];
	/** A short title for the request */
	title: string;
	/** A description of the problem */
	problem: Markup;
	/** Descriptions of ideas for addressing the problem */
	ideas: Idea[];
	/** Status of the change request */
	status: 'triage' | 'backlog' | 'active' | 'completed' | 'abandoned' | 'closed';
};

export default Change;
