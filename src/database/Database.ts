import MockActivities from '$lib/mock/activities.json?raw';
import MockRole from '$lib/mock/role.json?raw';
import MockPeople from '$lib/mock/people.json?raw';
import MockOrganizations from '$lib/mock/organizations.json?raw';
import type { ActivityID } from '../types/Activity';
import type Activity from '../types/Activity';
import type { PersonID } from '../types/Person';
import type Person from '../types/Person';
import type { RoleID } from '../types/Role';
import type Role from '../types/Role';
import type { OrganizationID } from '../types/Organization';
import type Organization from '../types/Organization';

const roles = JSON.parse(MockRole) as Role[];
const activities = JSON.parse(MockActivities) as Activity[];
const people = JSON.parse(MockPeople) as Person[];
const organizations = JSON.parse(MockOrganizations) as Organization[];

/** Represents an interface to a database, and CRUD operations for modifying the database. */
class Database {
	constructor() {}

	async getRole(id: RoleID): Promise<Role | undefined> {
		return roles.find((role) => role.id === id);
	}

	async getRoleActivities(id: RoleID): Promise<Activity[]> {
		return activities.filter((activity) => activity.role === id);
	}

	async getOrganization(id: OrganizationID): Promise<Organization | undefined> {
		return organizations.find((org) => org.id === id);
	}

	async getOrganizationRoles(id: OrganizationID): Promise<Role[]> {
		return roles.filter((role) => role.organization === id);
	}

	async getOrganziationPeople(id: OrganizationID): Promise<Person[]> {
		return people.filter((people) => people.organizations.includes(id));
	}

	async getActivity(id: ActivityID): Promise<Activity> {
		const activity = activities.find((activity) => activity.id === id);
		if (activity === undefined) throw Error();
		else return activity;
	}

	async getPerson(id: PersonID): Promise<Person | undefined> {
		return people.find((person) => person.id === id);
	}

	async getPersonRoles(id: PersonID): Promise<Role[]> {
		return roles.filter((role) => role.people.includes(id));
	}
}

const database = new Database();

export default database;
