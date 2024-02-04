import type Markup from './Markup';
import type { PersonID } from './Person';

/** A part of completing an activity. */
type Task = {
	/** A Unix timestamp of who last modified this task */
	who: PersonID;
	/** what the task is */
	what: Markup;
	/** how to do the task, in terms of subtasks */
	how: Task[];
	/** whether the task is done */
	complete: boolean;
	/** Whether this task is public. Overriden by private activities. */
	public: boolean;
};

export type { Task as default };
