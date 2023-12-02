import type Markup from './Markup';
import type { Day } from './Day';
import type { PersonID } from './Person';
import type Task from './Task';
import type Repeat from './Day';

/** A unique ID to represent an activity */
type ActivityID = string;

/** Something that must in a scope of responsibilities, possibly periodically. */
type Activity = {
	id: ActivityID;
	/** A Unix timestamp of when this activity was created */
	created: number;
	/** A Unix timestamp of when this activity was last modified */
	modified: number;
	/** A Unix timestamp of who last modified this activity */
	modifier: PersonID;
	/** Whether this is unfinished; if false, then it's a ground truth activity. */
	draft: boolean;
	/** The last version of the activity, forming a linked list of activity versions. */
	previous: ActivityID | null;
	/** The optional period on which the activity repeats */
	time: {
		/** The concrete day on which the activity starts */
		start: Day;
		/** An optional repetition schedule */
		repeat: Repeat | null;
	};
	/** An emoji representing the theme of the activity */
	icon: string;
	/** a short description of the activity without line breaks */
	what: Markup;
	/** what’s the rationale for the activity? how does it tie to organizational goals? */
	why: Markup;
	/** who is responsible for ensuring that it’s done */
	leader: PersonID;
	/** everyone who can edit the task **/
	collaborators: PersonID[];
	/** the tasks involved in completing the activity */
	how: Task[];
	/** Whether this activity is public. Overriden by private role. */
	public: boolean;
};

export default Activity;
