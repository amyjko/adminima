import type Markup from './Markup';
import type { PersonID } from './Person';

/** A scope of resopnsibilities, including zero or more activities. */
type Scope = {
	id: string;
	/** A descripition of what the scope of responsibilities are. */
	what: Markup;
	/** An emoji to represent the scope */
	icon: string;
	/** Who manages this scope of responsibilities (and can edit it). */
	managers: PersonID[];
	/** Who can view this scope of responsibilities (and comment on it) */
	viewers: PersonID[];
	/** Whether this scope is public to everyone. */
	public: boolean;
};

export default Scope;
