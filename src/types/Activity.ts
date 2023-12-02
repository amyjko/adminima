import type Markup from './Markup';
import type { Day } from './Day';
import type { PersonID } from './Person';
import type Task from './Task';
import type Repeat from './Day';
import type { RoleID } from './Role';
import type { OrganizationID } from './Organization';

/** A unique ID to represent an activity */
export type ActivityID = string;

/** Something that must in a scope of responsibilities, possibly periodically. */
type Activity = {
	/** A unique identifier for this activity */
	id: ActivityID;
	/** The role responsibile for getting this task done */
	role: RoleID;
	/** The organization this activity is in */
	organization: OrganizationID;
	/** the person responsible for doing this activity **/
	leader: PersonID[];
	/** other people involved in the work **/
	collaborators: PersonID[];
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
	/** the tasks involved in completing the activity */
	how: Task[];
	/** Whether this activity is public. Overriden by private role. */
	public: boolean;
};

export default Activity;
