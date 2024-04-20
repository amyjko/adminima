import type Markup from './Markup';

export type StatusID = string;
/** Metadata for tagging processes, roles, and changes to indicate where they are in change flows. */
type Status = {
	/** An ID for the status */
	id: StatusID;
	/** A name for the status */
	name: string;
	/** An explanation of what the status means */
	description: Markup;
};

export type { Status as default };
