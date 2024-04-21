import type { OrgPayload } from '$database/Database';
import type { ChangeID } from './Change';
import type Markup from './Markup';
import type Organization from './Organization';
import type Person from './Person';
import type { PersonID } from './Person';
import type { ProcessID } from './Process';
import type Process from './Process';
import type { RoleID } from './Role';
import type Role from './Role';
import type { StatusID } from './Status';
import type { TeamID } from './Team';

/** A wrapper class to provide utility functions on an organization payload from the database. Simplifies the interface for accessing organization content. */
export default class Org {
	readonly data: OrgPayload;

	constructor(data: OrgPayload) {
		this.data = data;
	}

	getID() {
		return this.data.organization.id;
	}

	getName() {
		return this.data.organization.name;
	}

	hasAdmin(person: Person | PersonID): boolean {
		return this.data.organization.admins.includes(typeof person === 'string' ? person : person.id);
	}

	withAdmin(person: PersonID): Organization {
		return {
			...this.data.organization,
			admins: Array.from(new Set([...this.data.organization.admins, person]))
		};
	}

	withoutAdmin(person: PersonID): Organization {
		return {
			...this.data.organization,
			admins: this.data.organization.admins.filter((admin) => admin !== person)
		};
	}

	withStaff(person: PersonID | Person): Organization {
		const id = typeof person === 'string' ? person : person.id;

		return {
			...this.data.organization,
			staff: Array.from(new Set([...this.data.organization.staff, id]))
		};
	}

	withoutStaff(person: PersonID | Person): Organization {
		const id = typeof person === 'string' ? person : person.id;

		return {
			...this.data.organization,
			staff: this.data.organization.staff.filter((staff) => staff !== id)
		};
	}

	getDescription() {
		return this.data.organization.description;
	}

	withDescription(description: Markup): Organization {
		return { ...this.data.organization, description };
	}

	withName(name: string): Organization {
		return { ...this.data.organization, name };
	}

	getAdminCount() {
		return this.data.organization.admins.length;
	}

	hasStaff(personID: PersonID): boolean {
		return this.data.organization.staff.includes(personID);
	}

	getOrganization() {
		return this.data.organization;
	}

	getChange(id: ChangeID) {
		return this.data.changes.find((change) => change.id === id) ?? null;
	}

	getChanges() {
		return this.data.changes;
	}

	getRole(id: RoleID): Role | null {
		return this.data.roles.find((role) => role.id === id) ?? null;
	}

	getRoles() {
		return this.data.roles;
	}

	getRoleProcesses(role: Role): Process[] {
		return this.data.processes.filter(
			(task) =>
				task.accountable === role.id ||
				task.responsible.includes(role.id) ||
				task.consulted.includes(role.id) ||
				task.informed.includes(role.id)
		);
	}

	getPerson(id: PersonID): Person | null {
		return this.data.people.find((person) => person.id === id) ?? null;
	}

	getPersonRoles(person: Person | PersonID): Role[] {
		return this.data.roles.filter((role) =>
			role.people.includes(typeof person === 'string' ? person : person.id)
		);
	}

	getProcess(id: ProcessID) {
		return this.data.processes.find((task) => task.id === id) ?? null;
	}

	getProcesses() {
		return this.data.processes;
	}

	getPeople() {
		return this.data.people;
	}

	getPersonNamed(name: string) {
		return this.data.people.filter((person) =>
			person.name.toLocaleLowerCase().includes(name.toLocaleLowerCase())
		);
	}

	getStatus(id: StatusID) {
		return this.data.organization.statuses.find((status) => status.id === id) ?? null;
	}

	getTeam(id: TeamID) {
		return this.data.organization.teams.find((team) => team.id === id) ?? null;
	}

	getTeamRoles(teamID: TeamID): Role[] {
		return this.data.roles.filter((role) => role.team === teamID);
	}
}
