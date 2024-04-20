import type Markup from './Markup';
import type { RoleID } from './Role';
import type { ConcernID, OrganizationID } from './Organization';
import type Tracked from './Tracked';
import type Repeat from './Repeat';
import type { Day } from './Repeat';

/** A unique ID to represent an process */
export type ProcessID = string;

/** Something that must in a scope of responsibilities, possibly periodically. */
type Process = Tracked &
	Task & {
		/** A unique identifier for this process */
		id: ProcessID;
		/** An emoji representing the theme of the process */
		icon: string;
		/** The organization this process is in */
		organization: OrganizationID;
		/** The concern this process is related to */
		concern: ConcernID;
		/** The date on which this process started, or the frequency on which it occurs, or none of it has neither. */
		start: Day | null;
		/** Frequency */
		repeat: Repeat | null;
		/** A short description of the process */
		title: string;
		/** Whether this process is visible to anyone. Overriden by private role. */
		public: boolean;
	};

export type Task = {
	/** The role accountable for the task */
	accountable: RoleID;
	/** The roles responsible for completing the task **/
	responsible: RoleID[];
	/** The roles responsible for completing the task **/
	consulted: RoleID[];
	/** The roles responsible for completing the task **/
	informed: RoleID[];
	/** a short description of the process without line breaks */
	what: Markup;
	/** the tasks involved in completing the process */
	how: Task[];
};

export type { Process as default };
