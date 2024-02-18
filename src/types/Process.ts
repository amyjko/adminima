import type Markup from './Markup';
import type { Day } from './Day';
import type Task from './Task';
import type Repeat from './Day';
import type { RoleID } from './Role';
import type { OrganizationID } from './Organization';
import type Tracked from './Tracked';

/** A unique ID to represent an process */
export type ProcessID = string;

/** Something that must in a scope of responsibilities, possibly periodically. */
type Process = Tracked & {
	/** A unique identifier for this process */
	id: ProcessID;
	/** The template this is based on, if this is a concrete instance of an process */
	template: ProcessID | null;
	/** The role responsibile for getting this task done */
	role: RoleID;
	/** The organization this process is in */
	organization: OrganizationID;
	/** other people involved in the work **/
	roles: [RoleID, ...RoleID[]];
	/** Whether this is unfinished; if false, then it's a ground truth process. */
	draft: boolean;
	/** The last version of the process, forming a linked list of process versions. */
	previous: ProcessID | null;
	/** The date on which this process started, or the frequency on which it occurs, or none of it has neither. */
	start: Day | null;
	/** Frequency */
	repeat: Repeat | null;
	/** An emoji representing the theme of the process */
	icon: string;
	/** a short description of the process without line breaks */
	what: Markup;
	/** what’s the rationale for the process? how does it tie to organizational goals? */
	why: Markup;
	/** the tasks involved in completing the process */
	how: Task[];
	/** Whether this process is public. Overriden by private role. */
	public: boolean;
};

export type { Process as default };
