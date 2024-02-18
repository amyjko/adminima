import type Markup from './Markup';
import type { PersonID } from './Person';
import type { ChangeID } from './Change';

type Modification = {
	/** A unix time stamp of when the modification occurred */
	time: number;
	/** Who made the modification */
	person: PersonID;
	/** A description of what changed */
	what: Markup;
	/** Why it changed */
	why: Markup;
	/** Optional request related to the change */
	change: ChangeID | null;
};

export type { Modification as default };
