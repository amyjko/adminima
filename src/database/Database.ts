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
import { get, writable, type Writable } from 'svelte/store';

/** Represents an interface to a database, and CRUD operations for modifying the database. */
class Database {
	readonly roles = JSON.parse(MockRole) as Role[];
	readonly activities = JSON.parse(MockActivities) as Activity[];
	readonly people = new Map<PersonID, Writable<Person | null | undefined>>();
	readonly organizations = new Map<OrganizationID, Writable<Organization | null | undefined>>();

	readonly requests = JSON.parse(MockRequests) as Request[];

	constructor() {
		for (const org of JSON.parse(MockOrganizations) as Organization[])
			this.organizations.set(org.id, writable(org));

		for (const person of JSON.parse(MockPeople) as Person[])
			this.people.set(person.id, writable(person));
	}

	async getRole(id: RoleID): Promise<Role | undefined> {
		return this.roles.find((role) => role.id === id);
	}

	async getRoleActivities(id: RoleID): Promise<Activity[]> {
		return this.activities.filter((activity) => activity.role === id);
	}

	async getRoleRequests(id: RoleID): Promise<Request[]> {
		return this.requests.filter((request) => request.roles.includes(id));
	}

	getOrganization(id: OrganizationID): Writable<Organization | null | undefined> {
		let match = this.organizations.get(id);
		if (match === undefined) {
			match = writable(undefined);
			this.organizations.set(id, match);
		}
		return match;
	}

	async updateOrganization(organization: Organization) {
		const org = this.organizations.get(organization.id);
		if (org) org.set(organization);
	}

	async getOrganizationRoles(id: OrganizationID): Promise<Role[]> {
		return this.roles.filter((role) => role.organization === id);
	}

	async getOrganizationPeople(id: OrganizationID): Promise<PersonID[]> {
		const org = get(this.getOrganization(id));
		if (org) return org.staff;
		else return [];
	}

	async getOrganizationRequests(id: OrganizationID): Promise<Request[]> {
		return this.requests.filter((request) => request.organization === id);
	}

	async getActivity(id: ActivityID): Promise<Activity> {
		const activity = this.activities.find((activity) => activity.id === id);
		if (activity === undefined) throw Error();
		else return activity;
	}

	async getActivityRequests(id: ActivityID): Promise<Request[]> {
		return this.requests.filter((request) => request.activities.includes(id));
	}

	getPerson(id: PersonID): Writable<Person | undefined | null> {
		let match = this.people.get(id);
		if (match === undefined) {
			match = writable(undefined);
			this.people.set(id, match);
		}
		return match;
	}

	async getPeople(name: string): Promise<Person[]> {
		return Array.from(this.people.values())
			.map((person) => get(person))
			.filter(
				(person): person is Person =>
					person !== undefined &&
					person !== null &&
					person.name.toLocaleLowerCase().includes(name.toLocaleLowerCase())
			);
	}

	async getPersonRoles(id: PersonID): Promise<Role[]> {
		return this.roles.filter((role) => role.people.includes(id));
	}

	async getRequest(id: RequestID): Promise<Request | undefined> {
		return this.requests.find((request) => request.id === id);
	}
}

const database = new Database();

export default database;
