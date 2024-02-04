import type { ActivityID } from './Activity';
import type Markup from './Markup';
import type { OrganizationID } from './Organization';
import type { PersonID } from './Person';
import type { RoleID } from './Role';
import type Tracked from './Tracked';

type Comment = {
	/** Unix time of when it was created */
	when: number;
	/** Optional creator of the idea */
	who: PersonID;
	/** A description of the idea and its tradeoffs */
	what: Markup;
};

export type RequestID = string;

/** A change request. */
type Request = Tracked & {
	/** Unique ID for this change request. */
	id: RequestID;
	/** Who submitted the change request */
	who: PersonID;
	/** People who want to know about changes to this change request */
	watchers: PersonID[];
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
	comments: Comment[];
	/** Status of the change request */
	status: 'triage' | 'backlog' | 'active' | 'completed' | 'abandoned' | 'closed';
};

export type { Request as default };
