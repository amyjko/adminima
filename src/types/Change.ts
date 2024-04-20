import type { ProcessID } from './Process';
import type Markup from './Markup';
import type { OrganizationID, StatusID } from './Organization';
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

export type ChangeID = string;

/** A change request. */
type Change = Tracked & {
	/** Unique ID for this change request. */
	id: ChangeID;
	/** Who submitted the change request */
	who: PersonID;
	/** People who want to know about changes to this change request */
	watchers: PersonID[];
	/** The organization the change was requested for */
	organization: OrganizationID;
	/** Roles affected by this request */
	roles: RoleID[];
	/** Processes affected by this request */
	processes: ProcessID[];
	/** A short title for the request */
	title: string;
	/** A description of the problem */
	problem: Markup;
	/** Descriptions of ideas for addressing the problem */
	comments: Comment[];
	/** Status of the change request */
	status: StatusID | null;
};

export type { Change as default };
