import type Markup from './Markup';
import type { PersonID } from './Person';

export type TaskID = string;

/** A part of completing an activity. */
type Task = {
	id: TaskID;
	/** A Unix time stamp of when the task was created */
	created: number;
	/** A Unix time stamp of when the task was last modified */
	modified: number;
	/** A Unix timestamp of who last modified this task */
	modifier: PersonID;
	/** optional number of days after activity start date when the task is due */
	due: number;
	/** what the task is */
	what: Markup;
	/** how to do the task, in terms of subtasks */
	how: Task[];
	/** Comments on the task, such as status updates, revision suggestions */
	comments: Comment[];
	/** whether the task is done */
	complete: boolean;
	/** Whether this task is public. Overriden by private activities. */
	public: boolean;
};

/** A comment on a task */
type Comment = {
	/** Who made the comment */
	who: PersonID;
	/** The comment text */
	what: Markup;
	/** Whether the comment is resolved */
	resolved: boolean;
};

export type { Task as default };
