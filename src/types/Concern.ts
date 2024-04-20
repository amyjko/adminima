import type Markup from './Markup';

export type ConcernID = string;
/** Metadata for tagging what area of concern a process is related to. */
type Concern = {
	/** An ID for the concern */
	id: ConcernID;
	/** The concern's name */
	name: string;
	/** The concern's description */
	description: Markup;
};

export type { Concern as default };
