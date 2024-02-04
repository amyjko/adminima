import MockActivities from '$lib/mock/activities.json?raw';
import MockRole from '$lib/mock/role.json?raw';
import MockPeople from '$lib/mock/people.json?raw';
import MockOrganizations from '$lib/mock/organizations.json?raw';
import MockRequests from '$lib/mock/requests.json?raw';
import type { ActivityID } from '../types/Activity';
import type Activity from '../types/Activity';
import type { PersonID } from '../types/Person';
import type Person from '../types/Person';
import type { RoleID } from '../types/Role';
import type Role from '../types/Role';
import type { OrganizationID } from '../types/Organization';
import type Organization from '../types/Organization';
import type Request from '../types/Request';
import type { RequestID } from '../types/Request';

const roles = JSON.parse(MockRole) as Role[];
const activities = JSON.parse(MockActivities) as Activity[];
const people = JSON.parse(MockPeople) as Person[];
const organizations = JSON.parse(MockOrganizations) as Organization[];
const requests = JSON.parse(MockRequests) as Request[];

/** Represents an interface to a database, and CRUD operations for modifying the database. */
class Database {
	constructor() {}

	async getRole(id: RoleID): Promise<Role | undefined> {
		return roles.find((role) => role.id === id);
	}

	async getRoleActivities(id: RoleID): Promise<Activity[]> {
		return activities.filter((activity) => activity.role === id);
	}

	async getRoleRequests(id: RoleID): Promise<Request[]> {
		return requests.filter((request) => request.roles.includes(id));
	}

	async getOrganization(id: OrganizationID): Promise<Organization | undefined> {
		return organizations.find((org) => org.id === id);
	}

	async getOrganizationRoles(id: OrganizationID): Promise<Role[]> {
		return roles.filter((role) => role.organization === id);
	}

	async getOrganizationPeople(id: OrganizationID): Promise<Person[]> {
		return people.filter((people) => people.organizations.includes(id));
	}

	async getOrganizationRequests(id: OrganizationID): Promise<Request[]> {
		return requests.filter((request) => request.organization === id);
	}

	async getActivity(id: ActivityID): Promise<Activity> {
		const activity = activities.find((activity) => activity.id === id);
		if (activity === undefined) throw Error();
		else return activity;
	}

	async getActivityRequests(id: ActivityID): Promise<Request[]> {
		return requests.filter((request) => request.activities.includes(id));
	}

	async getPerson(id: PersonID): Promise<Person | undefined> {
		return people.find((person) => person.id === id);
	}

	async getPersonRoles(id: PersonID): Promise<Role[]> {
		return roles.filter((role) => role.people.includes(id));
	}

	async getRequest(id: RequestID): Promise<Request | undefined> {
		return requests.find((request) => request.id === id);
	}
}

const database = new Database();

export default database;
