import type Markup from './Markup';
import type { PersonID } from './Person';
import type Tracked from './Tracked';
import type Visibility from './Visibility';

export type OrganizationID = string;

export type ConcernID = string;
/** Metadata for tagging what area of concern a process is related to. */
export type Concern = {
	/** An ID for the concern */
	id: ConcernID;
	/** The concern's name */
	name: string;
	/** The concern's description */
	description: Markup;
};

export type StatusID = string;
/** Metadata for tagging processes, roles, and changes to indicate where they are in change flows. */
export type Status = {
	/** An ID for the status */
	id: StatusID;
};

/** A group of people with a shared goal. Team membership is set on the person, as people can only be part of one team. */
export type TeamID = string;
export type Team = {
	/** The team's ID */
	id: TeamID;
	/** The team's name */
	name: string;
	/** A description of the team's goals */
	description: Markup;
};

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

export function withAdmin(organization: Organization, person: PersonID): Organization {
	return { ...organization, admins: Array.from(new Set([...organization.admins, person])) };
}

export function withoutAdmin(organization: Organization, person: PersonID): Organization {
	return { ...organization, admins: organization.admins.filter((admin) => admin !== person) };
}

export function withStaff(organization: Organization, person: PersonID): Organization {
	return { ...organization, staff: Array.from(new Set([...organization.staff, person])) };
}

export function withoutStaff(organization: Organization, person: PersonID): Organization {
	return { ...organization, staff: organization.staff.filter((staff) => staff !== person) };
}

export function withDescription(organization: Organization, description: Markup): Organization {
	return { ...organization, description };
}

export function withName(organization: Organization, name: string): Organization {
	return { ...organization, name };
}
