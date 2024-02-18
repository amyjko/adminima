import MockProcesses from '$lib/mock/processes.json?raw';
import MockRoles from '$lib/mock/roles.json?raw';
import MockPeople from '$lib/mock/people.json?raw';
import MockOrganizations from '$lib/mock/organizations.json?raw';
import MockChanges from '$lib/mock/changes.json?raw';
import type { ProcessID } from '../types/Process';
import type Process from '../types/Process';
import type { PersonID } from '../types/Person';
import type Person from '../types/Person';
import type { RoleID } from '../types/Role';
import type Role from '../types/Role';
import type { OrganizationID } from '../types/Organization';
import type Organization from '../types/Organization';
import type Change from '../types/Change';
import type { ChangeID } from '../types/Change';
import { get, type Writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import type Markup from '../types/Markup';
import ReactiveMap from './ReactiveMap';

/** Represents an interface to a database, and CRUD operations for modifying the database. */
class Database {
	readonly processes = new ReactiveMap<ProcessID, Process>();
	readonly organizations = new ReactiveMap<OrganizationID, Organization>();
	readonly people = new ReactiveMap<PersonID, Person>();
	readonly roles = new ReactiveMap<RoleID, Role>();
	readonly changes = new ReactiveMap<ChangeID, Change>();

	constructor() {
		for (const process of JSON.parse(MockProcesses) as Process[])
			this.processes.set(process.id, process);

		for (const org of JSON.parse(MockOrganizations) as Organization[])
			this.organizations.set(org.id, org);

		for (const person of JSON.parse(MockPeople) as Person[]) this.people.set(person.id, person);

		for (const role of JSON.parse(MockRoles) as Role[]) this.roles.set(role.id, role);

		for (const change of JSON.parse(MockChanges) as Change[]) this.changes.set(change.id, change);
	}

	async createRole(who: PersonID, organization: OrganizationID, title: string): Promise<Role> {
		const newRole: Role = {
			id: uuidv4(),
			organization,
			title,
			what: '',
			people: [],
			modifications: [
				{
					time: Date.now(),
					person: who,
					what: 'Created role',
					why: '',
					change: null
				}
			]
		};

		this.roles.set(newRole.id, newRole);

		return newRole;
	}

	getRole(id: RoleID): Writable<Role | undefined | null> {
		return this.roles.getStore(id);
	}

	async deleteRole(id: RoleID) {
		this.processes.delete(id);
	}

	async getRoleProcesses(id: RoleID): Promise<Process[]> {
		return this.processes.values().filter((process) => process.role === id);
	}

	async getRoleChanges(id: RoleID): Promise<Change[]> {
		return this.changes.values().filter((request) => request.roles.includes(id));
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

	async getOrganizationProcesses(id: OrganizationID): Promise<Process[]> {
		return this.processes.values().filter((process) => process.organization === id);
	}

	async getOrganizationStaff(id: OrganizationID): Promise<PersonID[]> {
		const org = get(this.getOrganization(id));
		if (org) return org.staff;
		else return [];
	}

	async getOrganizationChanges(id: OrganizationID): Promise<Change[]> {
		return this.changes.values().filter((change) => change.organization === id);
	}

	getProcess(id: ProcessID): Writable<Process | undefined | null> {
		return this.processes.getStore(id);
	}

	async deleteProcess(id: ProcessID) {
		this.processes.delete(id);
	}

	async getProcessChanges(id: ProcessID): Promise<Change[]> {
		return this.changes.values().filter((change) => change.processes.includes(id));
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

	async createChange(
		who: PersonID,
		organization: OrganizationID,
		title: string,
		problem: Markup,
		processes: ProcessID[],
		roles: RoleID[]
	): Promise<Change> {
		const newRequest: Change = {
			id: uuidv4(),
			who,
			title,
			problem,
			watchers: [],
			organization,
			roles,
			processes: processes,
			comments: [],
			status: 'triage',
			modifications: [
				{
					time: Date.now(),
					person: who,
					what: 'Created request',
					why: '',
					change: null
				}
			]
		};

		this.changes.set(newRequest.id, newRequest);

		return newRequest;
	}

	getRequest(id: ChangeID): Writable<Change | undefined | null> {
		return this.changes.getStore(id);
	}

	deleteRequest(id: ChangeID) {
		this.changes.delete(id);
	}
}

const database = new Database();

export default database;
