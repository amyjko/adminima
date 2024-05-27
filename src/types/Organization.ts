import type {
	AssignmentRow,
	ChangeRow,
	HowRow,
	OrganizationPayload,
	OrganizationRow,
	ProcessRow,
	ProfileRow,
	RoleRow,
	TeamRow
} from '$database/Organizations';

export type OrganizationID = string;
export type ProcessID = string;
export type TeamID = string;
export type RoleID = string;
export type PersonID = string;
export type HowID = string;
export type ChangeID = string;
export type CommentID = string;
export type Markup = string;
export type MarkupID = string;

/** A wrapper class to provide utility functions on an organization payload from the database. Simplifies the interface for accessing and manipulating organization data. */
export default class Organization {
	private readonly data: OrganizationPayload;

	constructor(data: OrganizationPayload) {
		this.data = data;
	}

	getID() {
		return this.data.organization.id;
	}

	getName() {
		return this.data.organization.name;
	}

	getVisibility() {
		return this.data.organization.visibility;
	}

	getComments() {
		return this.data.organization.comments;
	}

	/** Create a new organization with the updated row */
	withUpdate(row: OrganizationRow) {
		return new Organization({
			...this.data,
			organization: row
		});
	}

	/** Update or insert the new profile */
	withProfile(newProfile: ProfileRow) {
		return new Organization({
			...this.data,
			// If the profiles contains this person, replace the current record with the new one. Otherwise, add the new record.
			profiles: this.data.profiles.some((profile) => profile.personid === newProfile.personid)
				? this.data.profiles.map((profile) =>
						profile.personid === newProfile.personid ? newProfile : profile
				  )
				: [...this.data.profiles, newProfile]
		});
	}

	/** Remove the person from the record */
	withoutProfile(personID: PersonID) {
		return new Organization({
			...this.data,
			profiles: this.data.profiles.filter((profile) => profile.personid !== personID)
		});
	}

	/** Return the profiles of admins in this organization */
	getAdmins() {
		return this.data.profiles.filter((profile) => profile.admin);
	}

	/** Return true if the given person ID is an admin in this organization */
	hasAdmin(personID: PersonID): boolean {
		return this.getAdmins().some((profile) => profile.personid === personID);
	}

	/** Get the organization's description. */
	getDescription() {
		return this.data.organization.description;
	}

	/** Get the number of administrators */
	getAdminCount() {
		return this.getAdmins().length;
	}

	/** True if the person is added to the organization */
	hasPerson(personID: PersonID): boolean {
		return this.data.profiles.some((profile) => profile.personid === personID);
	}

	getChange(id: ChangeID) {
		return this.data.changes.find((change) => change.id === id) ?? null;
	}

	getChanges() {
		return this.data.changes;
	}

	withChange(newChange: ChangeRow) {
		return new Organization({
			...this.data,
			changes: this.data.changes.some((change) => change.id === newChange.id)
				? this.data.changes.map((change) => (change.id === newChange.id ? newChange : change))
				: [...this.data.changes, newChange]
		});
	}

	withoutChange(changeID: ChangeID) {
		return new Organization({
			...this.data,
			changes: this.data.changes.filter((change) => change.id !== changeID)
		});
	}

	/** Get the role corresponding to the ID */
	getRole(id: RoleID): RoleRow | null {
		return this.data.roles.find((role) => role.id === id) ?? null;
	}

	/** Get all the roles for this organization. */
	getRoles() {
		return this.data.roles;
	}

	/** Create a version of this organization with a new or updated role */
	withRole(newRole: RoleRow) {
		return new Organization({
			...this.data,
			roles: this.data.roles.some((role) => role.id === newRole.id)
				? this.data.roles.map((role) => (role.id === newRole.id ? newRole : role))
				: [...this.data.roles, newRole]
		});
	}

	/** Create a version of this organization without the given role */
	withoutRole(roleID: RoleID) {
		return new Organization({
			...this.data,
			roles: this.data.roles.filter((role) => role.id !== roleID)
		});
	}

	/** Create a version of this organization with a new or updated role */
	withProcess(newProcess: ProcessRow) {
		return new Organization({
			...this.data,
			processes: this.data.processes.some((process) => process.id === newProcess.id)
				? this.data.processes.map((process) =>
						process.id === newProcess.id ? newProcess : process
				  )
				: [...this.data.processes, newProcess]
		});
	}

	/** Create a version of this organization without the given role */
	withoutProcess(processID: ProcessID) {
		return new Organization({
			...this.data,
			processes: this.data.processes.filter((process) => process.id !== processID)
		});
	}

	/** Create a version of this organization with a new or updated role */
	withHow(newHow: HowRow) {
		return new Organization({
			...this.data,
			hows: this.data.hows.some((how) => how.id === newHow.id)
				? this.data.hows.map((how) => (how.id === newHow.id ? newHow : how))
				: [...this.data.hows, newHow]
		});
	}

	/** Create a version of this organization without the given role */
	withoutHow(howID: HowID) {
		return new Organization({
			...this.data,
			hows: this.data.hows.filter((how) => how.id !== howID)
		});
	}

	/** Find the profile of the given person, or null if no match */
	getProfile(id: PersonID): ProfileRow | null {
		return this.data.profiles.find((person) => person.personid === id) ?? null;
	}

	/** Get the roles that the given person has */
	getPersonRoles(personid: PersonID): RoleRow[] {
		// Get the assignments for the person, and convert them into roles.
		return this.data.assignments
			.filter((assignment) => assignment.personid === personid)
			.map((assignment) => this.data.roles.find((role) => assignment.roleid === role.id))
			.filter((role): role is RoleRow => role !== undefined);
	}

	/** Create an organization with the given assignment */
	withAssignment(assignment: AssignmentRow) {
		return new Organization({
			...this.data,
			assignments: [...this.data.assignments, assignment]
		});
	}

	/** Create an organization without the given assignment */
	withoutAssignment(roleid: RoleID, personid: PersonID) {
		return new Organization({
			...this.data,
			assignments: this.data.assignments.filter(
				(ass) => !(ass.personid === personid && ass.roleid === roleid)
			)
		});
	}

	getProcess(id: ProcessID) {
		return this.data.processes.find((process) => process.id === id) ?? null;
	}

	getProcesses() {
		return this.data.processes;
	}

	getHow(process: ProcessID) {
		return this.data.hows.find((how) => how.processid === process);
	}

	getRoleProcesses(role: RoleID): ProcessRow[] {
		return this.data.hows
			.filter(
				(task) =>
					task.accountable === role ||
					task.responsible?.includes(role) ||
					task.consulted?.includes(role) ||
					task.informed?.includes(role)
			)
			.map((how) => this.data.processes.find((process) => process.id === how.processid))
			.filter((process): process is ProcessRow => process !== undefined);
	}

	getRoleProfiles(role: RoleID): ProfileRow[] {
		return this.data.assignments
			.filter((ass) => ass.roleid === role)
			.map((ass) => this.data.profiles.find((profile) => profile.personid === ass.personid))
			.filter((profile): profile is ProfileRow => profile !== undefined);
	}

	getProfiles() {
		return this.data.profiles;
	}

	getPersonNamed(name: string) {
		return this.data.profiles.filter((person) =>
			person.name.toLocaleLowerCase().includes(name.toLocaleLowerCase())
		);
	}

	withTeam(newTeam: TeamRow) {
		return new Organization({
			...this.data,
			// If the profiles contains this person, replace the current record with the new one. Otherwise, add the new record.
			teams: this.data.teams.some((team) => team.id === newTeam.id)
				? this.data.teams.map((team) => (team.id === newTeam.id ? newTeam : team))
				: [...this.data.teams, newTeam]
		});
	}

	/** Remove the person from the record */
	withoutTeam(teamID: TeamID) {
		return new Organization({
			...this.data,
			teams: this.data.teams.filter((profile) => profile.id !== teamID)
		});
	}

	getTeams() {
		return [...this.data.teams];
	}

	getTeam(id: TeamID) {
		return this.data.teams.find((team) => team.id === id) ?? null;
	}

	getTeamRoles(teamID: TeamID): RoleRow[] {
		return this.data.roles.filter((role) => role.team === teamID);
	}
}
