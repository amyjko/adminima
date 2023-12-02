import type { ActivityID } from './Activity';
import type Markup from './Markup';
import type Modification from './Modification';
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
	/** Who submitted the change request */
	requestor: PersonID | null;
	/** People who want to know about changes to this change request */
	watchers: PersonID[];
	/** The modifications to this change request */
	modifications: Modification[];
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
