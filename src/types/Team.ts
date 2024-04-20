import type Markup from './Markup';

/** A group of people with a shared goal. Team membership is set on the person, as people can only be part of one team. */
export type TeamID = string;
type Team = {
	/** The team's ID */
	id: TeamID;
	/** The team's name */
	name: string;
	/** A description of the team's goals */
	description: Markup;
};

export type { Team as default };
