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
import { get, type Writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import type Markup from '../types/Markup';
import ReactiveMap from './ReactiveMap';

/** Represents an interface to a database, and CRUD operations for modifying the database. */
class Database {
	readonly activities = new ReactiveMap<ActivityID, Activity>();
	readonly organizations = new ReactiveMap<OrganizationID, Organization>();
	readonly people = new ReactiveMap<PersonID, Person>();
	readonly roles = new ReactiveMap<RoleID, Role>();
	readonly requests = new ReactiveMap<RequestID, Request>();

	constructor() {
		for (const activity of JSON.parse(MockActivities) as Activity[])
			this.activities.set(activity.id, activity);

		for (const org of JSON.parse(MockOrganizations) as Organization[])
			this.organizations.set(org.id, org);

		for (const person of JSON.parse(MockPeople) as Person[]) this.people.set(person.id, person);

		for (const role of JSON.parse(MockRole) as Role[]) this.roles.set(role.id, role);

		for (const request of JSON.parse(MockRequests) as Request[])
			this.requests.set(request.id, request);
	}

	async createRole(who: PersonID, organization: OrganizationID, title: string): Promise<Role> {
		const newRole: Role = {
			id: uuidv4(),
			organization,
			title,
			what: '',
			people: [],
			viewers: [],
			public: false,
			changes: [
				{
					time: Date.now(),
					person: who,
					what: 'Created role',
					why: '',
					request: null
				}
			]
		};

		this.roles.set(newRole.id, newRole);

		return newRole;
	}

	getRole(id: RoleID): Writable<Role | undefined | null> {
		return this.roles.getStore(id);
	}

	async getRoleActivities(id: RoleID): Promise<Activity[]> {
		return this.activities.values().filter((activity) => activity.role === id);
	}

	async getRoleRequests(id: RoleID): Promise<Request[]> {
		return this.requests.values().filter((request) => request.roles.includes(id));
	}

	getOrganization(id: OrganizationID): Writable<Organization | null | undefined> {
		return this.organizations.getStore(id);
	}

	async updateOrganization(organization: Organization) {
		const org = this.organizations.getStore(organization.id);
		if (org) org.set(organization);
	}

	async getOrganizationRoles(id: OrganizationID): Promise<Role[]> {
		return this.roles.values().filter((role) => role.organization === id);
	}

	async getOrganizationPeople(id: OrganizationID): Promise<PersonID[]> {
		const org = get(this.getOrganization(id));
		if (org) return org.staff;
		else return [];
	}

	async getOrganizationRequests(id: OrganizationID): Promise<Request[]> {
		return this.requests.values().filter((request) => request.organization === id);
	}

	getActivity(id: ActivityID): Writable<Activity | undefined | null> {
		return this.activities.getStore(id);
	}

	async getActivityRequests(id: ActivityID): Promise<Request[]> {
		return this.requests.values().filter((request) => request.activities.includes(id));
	}

	getPerson(id: PersonID): Writable<Person | undefined | null> {
		return this.people.getStore(id);
	}

	async getPeople(name: string): Promise<Person[]> {
		return this.people
			.values()
			.filter((person) => person.name.toLocaleLowerCase().includes(name.toLocaleLowerCase()));
	}

	async getPersonRoles(id: PersonID): Promise<Role[]> {
		return this.roles.values().filter((role) => role.people.includes(id));
	}

	async createRequest(
		who: PersonID,
		organization: OrganizationID,
		title: string,
		problem: Markup,
		activities: ActivityID[],
		roles: RoleID[]
	): Promise<Request> {
		const newRequest: Request = {
			id: uuidv4(),
			who,
			title,
			problem,
			watchers: [],
			organization,
			roles,
			activities,
			comments: [],
			status: 'triage',
			changes: [
				{
					time: Date.now(),
					person: who,
					what: 'Created request',
					why: '',
					request: null
				}
			]
		};

		this.requests.set(newRequest.id, newRequest);

		return newRequest;
	}

	getRequest(id: RequestID): Writable<Request | undefined | null> {
		return this.requests.getStore(id);
	}
}

const database = new Database();

export default database;
