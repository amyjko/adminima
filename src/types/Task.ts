import type Markup from './Markup';
import type Moment from './Moment';
import type { PersonID } from './Person';

export type TaskID = string;

/** A part of completing an activity. */
type Task = {
	id: TaskID;
	/** an optional due date or numbe of days after starting when task should be done */
	due: Moment | null;
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
