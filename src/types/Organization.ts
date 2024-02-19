import type Markup from './Markup';
import type { PersonID } from './Person';
import type Tracked from './Tracked';

export type OrganizationID = string;

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
