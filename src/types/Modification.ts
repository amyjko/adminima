import type Markup from './Markup';
import type { PersonID } from './Person';

type Modification = {
	/** A unix time stamp of when the modification occurred */
	time: number;
	/** Who made the modification */
	person: PersonID;
	/** A description of what changed */
	change: Markup;
	/** Why it changed */
	why: Markup;
};

export type { Modification as default };
