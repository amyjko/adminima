import type Modification from './Modification';
import type { PersonID } from './Person';

export type OrganizationID = string;

type Organization = {
	/** A unique organization identifier */
	id: OrganizationID;
	/** The organization's name */
	name: string;
	/** Administrators who can create new roles in the organization, change admins, and modify the organization's name. */
	admins: PersonID[];
	/** A list of modifications to the organization */
	modifications: Modification[];
};

export default Organization;
