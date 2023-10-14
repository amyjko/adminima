import type Markup from './Markup';
import type { PersonID } from './Person';

export type TaskID = string;

/** A part of completing an activity. */
type Task = {
	id: TaskID;
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

export default Task;
