import type Concern from './Concern';
import type Markup from './Markup';
import type { PersonID } from './Person';
import type Status from './Status';
import type Team from './Team';
import type Tracked from './Tracked';
import type Visibility from './Visibility';

export type OrganizationID = number;

type Organization = Tracked & {
	/** A unique organization identifier */
	id: OrganizationID;
	/** The organization's name */
	name: string;
	/** The organization's description */
	description: Markup;
	/** Administrators who can create new roles in the organization, change admins, and modify the organization's name. */
	admins: PersonID[];
	/** People in this organization */
	staff: PersonID[];
	/** Teams in this organization */
	teams: Team[];
	/** Areas of concern, used to tag processes, to help organize and explain them */
	concerns: Concern[];
	/** Statuses indicate different metadata on processes and roles (e.g., pending, discussed, active) */
	statuses: Status[];
	/** Who this organization is visible to */
	visibility: Visibility;
};

export type { Organization as default };
