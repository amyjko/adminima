import type Markup from './Markup';
import type { Weeks } from './Moment';
import type Moment from './Moment';
import type { PersonID } from './Person';
import type Task from './Task';

/** A unique ID to represent an activity */
type ActivityID = string;

/** Something that must be done periodically in the scope of responsibilities. */
type Activity = {
	id: ActivityID;
	/** The last version of the activity, forming a linked list of activity versions. */
	previous: ActivityID | null;
	/** When the activity starts */
	start: Moment;
	/** How many days the activity lasts */
	duration: Weeks;
	// Optional number of days before it should repeat again
	// frequency•Days|ø
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
};

export default Activity;
