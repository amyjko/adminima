import {
	type SupabaseClient,
	type PostgrestError,
	type RealtimeChannel,
	type RealtimePostgresChangesPayload
} from '@supabase/supabase-js';
import type Database from './Database';
import type Period from './Period';

type Tables = Database['public']['Tables'];
export type PersonRow = Tables['people']['Row'];
export type OrganizationRow = Tables['orgs']['Row'];
export type RoleRow = Tables['roles']['Row'];
export type ProfileRow = Tables['profiles']['Row'];
export type AssignmentRow = Tables['assignments']['Row'];
export type ProcessRow = Tables['processes']['Row'];
export type TeamRow = Tables['teams']['Row'];
export type HowRow = Tables['hows']['Row'];
export type ChangeRow = Tables['suggestions']['Row'];
export type CommentRow = Tables['comments']['Row'];
export type Visibility = Database['public']['Enums']['visibility'];
export type Completion = Database['public']['Enums']['completion'];
export type Status = Database['public']['Enums']['status'];
export type State = Database['public']['Enums']['state'];

export type OrganizationID = string;
export type ProcessID = string;
export type TeamID = string;
export type RoleID = string;
export type PersonID = string;
export type ProfileID = string;
export type HowID = string;
export type ChangeID = string;
export type CommentID = string;
export type Markup = string;

/** Encapsulates functionality related to querying the database and manipulating organization data. */
class Organization {
	private supabase: SupabaseClient<Database>;

	/** A list of listeners to notify of realtime updates. */
	private listeners: { id: OrganizationID; listener: () => void }[] = [];

	/** Organization specific Supabase realtime channels */
	readonly channels = new Map<OrganizationID, RealtimeChannel>();

	constructor(supabase: SupabaseClient<Database>) {
		this.supabase = supabase;
	}

	// Authentication

	async getUser() {
		return this.supabase.auth.getUser();
	}

	signOut() {
		return this.supabase.auth.signOut();
	}

	setSupabaseClient(client: SupabaseClient<Database>) {
		this.supabase = client;
	}

	// Realtime

	private getOrgChannel(orgid: OrganizationID): string {
		return `orgs:${orgid}`;
	}

	notify(orgid: OrganizationID) {
		for (const listener of this.listeners) if (listener.id === orgid) listener.listener();
	}

	/** Subscribe to an organization-specific channel, listening to all modifications to organization-related tables  */
	listen(org: OrganizationRow, listener: () => void) {
		const orgid = org.id;

		// Add the listener to the list of listeners.
		this.listeners.push({ id: orgid, listener });

		// See if there's a channel already.
		let channel = this.channels.get(this.getOrgChannel(orgid));

		// Already have a channel? No need to subscribe again.
		if (channel) return;

		// Otherwise, create a channel for this organization and listen to changes on it, keeping client-side model in sync with database.
		channel = this.supabase
			.channel(this.getOrgChannel(orgid))
			/** When an organization changes, update it's client-side store. */
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'orgs',
					/** Only listen to rows for this organization id */
					filter: `id=eq.${orgid}`
				},
				(payload: RealtimePostgresChangesPayload<OrganizationRow>) => {
					// Otherwise, update the organization.
					if (payload.eventType === 'UPDATE') this.notify(orgid);
				}
			)
			/** When a profile for this organization changes, refresh */
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'profiles',
					/** Only listen to rows for this organization id */
					filter: `orgid=eq.${orgid}`
				},
				() => {
					this.notify(orgid);
				}
			)
			/** When a role for this organization changes, update it's client-side store. */
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'roles',
					/** Only listen to rows for this organization id */
					filter: `orgid=eq.${orgid}`
				},
				() => {
					this.notify(orgid);
				}
			)
			/** When an assignment for this organization changes, update it's client-side store. */
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'assignments',
					/** Only listen to rows for this organization id */
					filter: `orgid=eq.${orgid}`
				},
				() => {
					this.notify(orgid);
				}
			)
			/** When a team for this organization changes, update it's client-side store. */
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'teams',
					/** Only listen to rows for this organization id */
					filter: `orgid=eq.${orgid}`
				},
				() => {
					this.notify(orgid);
				}
			)
			/** When an process for this organization changes, update it's client-side store. */
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'processes',
					/** Only listen to rows for this organization id */
					filter: `orgid=eq.${orgid}`
				},
				() => {
					this.notify(orgid);
				}
			)
			/** When a how for this organization changes, update it's client-side store. */
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'hows',
					/** Only listen to rows for this organization id */
					filter: `orgid=eq.${orgid}`
				},
				() => {
					this.notify(orgid);
				}
			)
			/** When a how for this organization changes, update it's client-side store. */
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'suggestions',
					/** Only listen to rows for this organization id */
					filter: `orgid=eq.${orgid}`
				},
				() => {
					this.notify(orgid);
				}
			)
			/** When a comment for this organization changes, update it's client-side store. */
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'comments',
					/** Only listen to rows for this organization id */
					filter: `orgid=eq.${orgid}`
				},
				() => {
					this.notify(orgid);
				}
			)
			.subscribe();
	}

	/** Unsubscribe from the organization specific channel, if there is one. */
	ignore(orgid: OrganizationID, listener: () => void) {
		const channel = this.channels.get(this.getOrgChannel(orgid));
		if (channel) this.supabase.removeChannel(channel);

		this.listeners = this.listeners.filter((l) => l.listener !== listener);
	}

	// Organizations

	/** Update an organization's description. Rely on Realtime to refresh. */
	async updateOrgDescription(
		org: OrganizationRow,
		text: string,
		who: PersonID
	): Promise<PostgrestError | null> {
		const { error } = await this.supabase
			.from('orgs')
			.update({ description: text })
			.eq('id', org.id);
		if (error) return error;
		const commentError = await this.addComment(
			org.id,
			who,
			'Updated organization description',
			'orgs',
			org.id,
			org.comments
		);
		return commentError;
	}

	/** Update an organization's description. Rely on Realtime to refresh. */
	async addOrgPath(org: OrganizationRow, path: string): Promise<PostgrestError | null> {
		const { error } = await this.supabase
			.from('orgs')
			.update({ paths: [path, ...org.paths] })
			.eq('id', org.id);
		return error;
	}

	async updateOrgPrompt(
		org: OrganizationRow,
		text: string,
		who: PersonID
	): Promise<PostgrestError | null> {
		const { error } = await this.supabase.from('orgs').update({ prompt: text }).eq('id', org.id);
		if (error) return error;
		const commentError = await this.addComment(
			org.id,
			who,
			'Updated organization change prompt',
			'orgs',
			org.id,
			org.comments
		);
		return commentError;
	}

	async updateOrgName(
		org: OrganizationRow,
		name: string,
		who: PersonID
	): Promise<PostgrestError | null> {
		if (org.name === name) return null;
		const { error } = await this.supabase.from('orgs').update({ name }).eq('id', org.id);
		if (error) return error;

		this.addComment(
			org.id,
			who,
			`Updated organization name to ${name}`,
			'orgs',
			org.id,
			org.comments
		);

		return null;
	}

	async updateOrgVisibility(
		org: OrganizationRow,
		visibility: Visibility,
		who: PersonID
	): Promise<PostgrestError | null> {
		const { error } = await this.supabase.from('orgs').update({ visibility }).eq('id', org.id);
		if (error) return error;

		return await this.addComment(
			org.id,
			who,
			`Updated organization visibility to ${visibility}`,
			'orgs',
			org.id,
			org.comments
		);
	}

	static getPath(org: OrganizationRow) {
		return org.paths[0] ?? org.id;
	}

	static getAdmins(profiles: ProfileRow[]): ProfileRow[] {
		return profiles.filter((profile) => profile.admin);
	}

	static hasAdminProfile(profiles: ProfileRow[], profileid: ProfileID): boolean {
		return Organization.getAdmins(profiles).some((profile) => profile.id === profileid);
	}

	static getAdminCount(profiles: ProfileRow[]): number {
		return Organization.getAdmins(profiles).length;
	}

	// Profiles

	static async queryProfiles(supabase: SupabaseClient<Database>, orgid: OrganizationID) {
		return supabase.from('profiles').select('*').eq('orgid', orgid);
	}

	static async queryProfile(
		supabase: SupabaseClient<Database>,
		orgid: OrganizationID,
		profile: ProfileID
	) {
		return supabase.from('profiles').select('*').eq('orgid', orgid).eq('id', profile).single();
	}

	async updateProfileName(profile: ProfileRow, name: string): Promise<PostgrestError | null> {
		const { error } = await this.supabase
			.from('profiles')
			.update({ name })
			.eq('email', profile.email)
			.eq('orgid', profile.orgid);
		return error;
	}

	async updateProfileBio(profile: ProfileRow, text: string) {
		const { error } = await this.supabase
			.from('profiles')
			.update({ bio: text })
			.eq('email', profile.email)
			.eq('orgid', profile.orgid);
		return error;
	}

	/** Update admin status of a person. Rely on realtime to refresh. */
	async updateAdmin(orgid: OrganizationID, profileid: ProfileID, admin: boolean) {
		const { error } = await this.supabase
			.from('profiles')
			.update({ admin })
			.eq('orgid', orgid)
			.eq('id', profileid);
		return error;
	}

	/** Add a person to the organization's profiles if not already added. Rely on Realtime notification for update. */
	async addPersonByID(orgid: OrganizationID, person: PersonID | PersonRow) {
		const { data, error } =
			typeof person === 'string' ? await this.getPerson(person) : { data: person, error: null };
		if (error) return error;
		const { error: insertError } = await this.supabase
			.from('profiles')
			.insert({ orgid, personid: data.id, name: '', email: data.email, admin: false });
		return insertError;
	}

	/** Add a person to the organization's profiles by email. Rely on Realtime notification for update. */
	async addPersonByEmail(orgid: OrganizationID, email: string, name: string | undefined) {
		const { error } = await this.supabase
			.from('profiles')
			.insert({ orgid, personid: null, name: name ?? '', email, admin: false });
		return error;
	}

	async getPersonProfile(orgid: OrganizationID, personid: PersonID) {
		const { data } = await this.supabase
			.from('profiles')
			.select()
			.eq('orgid', orgid)
			.eq('personid', personid)
			.single();

		return data;
	}

	// Assignments

	static async queryAssignments(supabase: SupabaseClient<Database>, orgid: OrganizationID) {
		return supabase.from('assignments').select('*').eq('orgid', orgid);
	}

	/** Get the roleids to which the given person's profile is assigned */
	static async queryPersonRoles(
		supabase: SupabaseClient<Database>,
		orgid: OrganizationID,
		personid: PersonID | null
	) {
		return personid
			? supabase
					.from('assignments')
					.select('roleid, profiles!inner(*)')
					.eq('orgid', orgid)
					.eq('profiles.personid', personid)
			: { data: [] };
	}

	async assignPerson(orgid: OrganizationID, profileid: ProfileID, roleid: RoleID) {
		const { error } = await this.supabase.from('assignments').insert({ orgid, profileid, roleid });
		return error;
	}

	async unassignPerson(orgid: OrganizationID, profileid: ProfileID, roleid: RoleID) {
		const { error } = await this.supabase
			.from('assignments')
			.delete()
			.eq('orgid', orgid)
			.eq('profileid', profileid)
			.eq('roleid', roleid);

		// No error? Update the organization on the front end.
		if (error === null) this.notify(orgid);

		return error;
	}

	// Roles

	static async queryRole(
		supabase: SupabaseClient<Database>,
		orgid: OrganizationID,
		roleid: RoleID
	) {
		const { data } = await supabase
			.from('roles')
			.select('*')
			.eq('orgid', orgid)
			.eq('id', roleid)
			.single();
		return data;
	}

	/** Get the role by short name */
	static async queryRoleByShortName(
		supabase: SupabaseClient<Database>,
		orgid: OrganizationID,
		name: string
	) {
		const { data } = await supabase
			.from('roles')
			.select('*')
			.eq('orgid', orgid)
			.contains('short', [name])
			.single();
		return data;
	}

	static async queryRoles(supabase: SupabaseClient<Database>, orgid: OrganizationID) {
		return supabase.from('roles').select('*').eq('orgid', orgid);
	}

	static getRoleByID(roles: RoleRow[], id: RoleID): RoleRow | null {
		return roles.find((role) => role.id === id) ?? null;
	}

	static getRoleProfiles(role: RoleID, assignments: AssignmentRow[], profiles: ProfileRow[]) {
		return assignments
			.filter((ass) => ass.roleid === role)
			.map((ass) => profiles.find((profile) => profile.id === ass.profileid))
			.filter((profile): profile is ProfileRow => profile !== undefined);
	}

	static getRoleProcesses(role: RoleID, hows: HowRow[], processes: ProcessRow[]): ProcessRow[] {
		return [
			...new Set([
				...hows
					.filter(
						(task) =>
							task.responsible?.includes(role) ||
							task.consulted?.includes(role) ||
							task.informed?.includes(role)
					)
					.map((how) => processes.find((process) => process.id === how.processid))
					.filter((process): process is ProcessRow => process !== undefined),
				...processes.filter((p) => p.accountable === role)
			])
		];
	}

	static getPersonRoles(profiles: ProfileRow[], assignments: AssignmentRow[], id: PersonID) {
		const profile = profiles.find((prof) => prof.personid === id);
		if (profile === undefined) return [];
		return assignments.filter((ass) => ass.profileid === profile.id).map((ass) => ass.roleid);
	}

	async getPersonWithEmail(email: string) {
		const { data } = await this.supabase.from('people').select().eq('email', email).single();
		return data;
	}

	static getProfileWithEmail(profiles: ProfileRow[], email: string): ProfileRow | null {
		return profiles.find((person) => person.email === email) ?? null;
	}

	static getProfileWithPersonID(profiles: ProfileRow[], id: PersonID): ProfileRow | null {
		return profiles.find((person) => person.personid === id) ?? null;
	}

	/** Get the name or email of the profile ID */
	static getPersonNameOrEmail(profiles: ProfileRow[], id: PersonID): string | null {
		const profile = profiles.find((p) => p.personid === id) ?? null;
		return profile === null ? null : profile.name === '' ? profile.email : profile.name;
	}

	static getProfileWithNameOrEmail(profiles: ProfileRow[], id: ProfileID) {
		const profile = profiles.find((profile) => profile.id === id) ?? null;
		return profile === null ? null : profile.name === '' ? profile.email : profile.name;
	}

	static getProfileWithID(profiles: ProfileRow[], id: ProfileID): ProfileRow | null {
		return profiles.find((person) => person.id === id) ?? null;
	}

	/** Get the roles that the given person has */
	static getProfileRoles(id: ProfileID, assignments: AssignmentRow[], roles: RoleRow[]): RoleRow[] {
		// Get the assignments for the person, and convert them into roles.
		return assignments
			.filter((assignment) => assignment.profileid === id)
			.map((assignment) => roles.find((role) => assignment.roleid === role.id))
			.filter((role): role is RoleRow => role !== undefined);
	}

	async updateProfileSupervisor(
		orgid: OrganizationID,
		profileid: ProfileID,
		supervisor: ProfileID | null
	) {
		const { error } = await this.supabase
			.from('profiles')
			.update({ supervisor })
			.eq('orgid', orgid)
			.eq('id', profileid);
		return error;
	}

	/** Remove a perosn from the organization's profiles if included. Rely on Realtime notification for update. */
	async removeProfile(profileid: ProfileID) {
		const { error } = await this.supabase.from('profiles').delete().eq('id', profileid);
		return error;
	}

	async createRole(orgid: OrganizationID, title: string) {
		return await this.supabase
			.from('roles')
			.insert({
				orgid: orgid,
				title
			})
			.select()
			.single();
	}

	async updateRoleTitle(
		role: RoleRow,
		title: string,
		who: PersonID
	): Promise<PostgrestError | null> {
		const { error } = await this.supabase.from('roles').update({ title: title }).eq('id', role.id);
		if (error) return error;

		return this.addComment(
			role.orgid,
			who,
			`Updated role title to ${title}`,
			'roles',
			role.id,
			role.comments
		);
	}

	async updateRoleDescription(role: RoleRow, description: string, who: PersonID) {
		const { error } = await this.supabase.from('roles').update({ description }).eq('id', role.id);
		if (error) return error;
		return this.addComment(
			role.orgid,
			who,
			'Updated role description',
			'roles',
			role.id,
			role.comments
		);
	}

	async updateRoleTeam(
		role: RoleRow,
		team: TeamID | null,
		name: string | undefined,
		who: PersonID
	) {
		const { error } = await this.supabase.from('roles').update({ team }).eq('id', role.id);
		if (error) return error;

		return this.addComment(
			role.orgid,
			who,
			name ? `Updated role team to ${name}` : `Removed role from team`,
			'roles',
			role.id,
			role.comments
		);
	}

	async updateRoleShortName(role: RoleRow, short: string) {
		const { error } = await this.supabase
			.from('roles')
			.update({ short: Array.from(new Set([short, ...role.short].filter((s) => s !== ''))) })
			.eq('id', role.id);
		return error;
	}

	// Comments

	async addComment(
		orgid: OrganizationID,
		who: PersonID,
		what: string,
		table: 'orgs' | 'roles' | 'teams' | 'processes' | 'suggestions',
		id: string,
		comments: CommentID[]
	) {
		// Insert the new comment.
		const { data: comment, error: insertError } = await this.supabase
			.from('comments')
			.insert({ orgid, what, who })
			.select()
			.single();
		if (insertError) return insertError;

		const commentID = comment?.id ?? null;

		// If we succeeded, update the list of comments for the table.
		if (commentID) {
			const newComments = [...comments, commentID];
			const { error: updateError } = await this.supabase
				.from(table)
				.update({ comments: newComments })
				.eq('id', id);
			if (updateError) return updateError;

			// If we succeeded, notify the organization of the change, since it's
			this.notify(orgid);
		}
		return null;
	}

	async deleteRole(orgid: OrganizationID, id: RoleID): Promise<PostgrestError | null> {
		// Remove role from any hows that reference them in responsible, consulted, or informed lists.

		const { data, error: howError } = await this.supabase.from('hows').select().eq('orgid', orgid);
		if (howError) return howError;

		for (const how of data) {
			if (how.responsible.includes(id)) {
				const { error: updateError } = await this.supabase
					.from('hows')
					.update({ responsible: how.responsible.filter((r: string) => r !== id) })
					.eq('id', how.id);
				if (updateError) return updateError;
			}
			if (how.consulted.includes(id)) {
				const { error: updateError } = await this.supabase
					.from('hows')
					.update({ consulted: how.consulted.filter((r: string) => r !== id) })
					.eq('id', how.id);
				if (updateError) return updateError;
			}
			if (how.informed.includes(id)) {
				const { error: updateError } = await this.supabase
					.from('hows')
					.update({ informed: how.informed.filter((r: string) => r !== id) })
					.eq('id', how.id);
				if (updateError) return updateError;
			}
		}

		const { error } = await this.supabase.from('roles').delete().eq('id', id);
		return error;
	}

	// Teams

	static getTeamRoles(roles: RoleRow[], teamID: TeamID): RoleRow[] {
		return roles.filter((role) => role.team === teamID);
	}

	static async queryTeams(supabase: SupabaseClient<Database>, orgid: OrganizationID) {
		return supabase.from('teams').select('*').eq('orgid', orgid);
	}

	static async queryTeam(
		supabase: SupabaseClient<Database>,
		orgid: OrganizationID,
		teamid: TeamID
	) {
		return supabase.from('teams').select('*').eq('orgid', orgid).eq('id', teamid).single();
	}

	static queryTeamRoles(supabase: SupabaseClient<Database>, orgid: OrganizationID, teamid: TeamID) {
		return supabase.from('roles').select('*').eq('orgid', orgid).eq('team', teamid);
	}

	async createTeam(orgid: OrganizationID, name: string) {
		return await this.supabase
			.from('teams')
			.insert({
				orgid: orgid,
				name
			})
			.select()
			.single();
	}

	/** Update an organization's description. Rely on Realtime to refresh. */
	async updateTeamDescription(
		team: TeamRow,
		text: string,
		who: PersonID
	): Promise<PostgrestError | null> {
		const { error } = await this.supabase
			.from('teams')
			.update({ description: text })
			.eq('id', team.id);
		if (error) return error;
		return this.addComment(
			team.orgid,
			who,
			'Updated team description',
			'teams',
			team.id,
			team.comments
		);
	}

	async updateTeamName(team: TeamRow, name: string, who: PersonID): Promise<PostgrestError | null> {
		const { error } = await this.supabase.from('teams').update({ name }).eq('id', team.id);
		if (error) return error;

		const comment = await this.addComment(
			team.orgid,
			who,
			`Updated team name to ${name}`,
			'orgs',
			team.id,
			team.comments
		);

		if (!comment) this.notify(team.orgid);

		return comment;
	}

	async deleteTeam(id: TeamID): Promise<PostgrestError | null> {
		const { error } = await this.supabase.from('teams').delete().eq('id', id);
		if (!error) this.notify(id);
		return error;
	}

	async getPerson(id: PersonID) {
		return await this.supabase.from('people').select().eq('id', id).single();
	}

	async createOrganization(
		orgName: string,
		adminName: string,
		invite: string,
		uid: string,
		email: string
	) {
		const { data, error } = await this.supabase.rpc('create_org', {
			adminname: adminName,
			orgname: orgName,
			invite: invite,
			uid,
			email
		});
		if (data) return data;
		else return error;
	}

	async pathIsAvailable(path: string): Promise<boolean> {
		const { data, error } = await this.supabase.rpc('path_available', {
			_path: path
		});
		if (error) return false;
		if (data) return data as boolean;
		else return false;
	}

	async getPersonsOrganizations(personid: PersonID) {
		return await this.supabase
			.from('orgs')
			.select(`id, name, paths, profiles!profiles_orgid_fkey(personid)`)
			.not('profiles', 'is', null)
			.eq('profiles.personid', personid);
	}

	// Processes

	static async queryProcesses(supabase: SupabaseClient<Database>, orgid: OrganizationID) {
		return supabase.from('processes').select('*').eq('orgid', orgid);
	}

	static async queryProcess(supabase: SupabaseClient<Database>, processid: ProcessID) {
		const { data } = await supabase.from('processes').select('*').eq('id', processid).single();
		return data;
	}

	static async queryConcerns(supabase: SupabaseClient<Database>, orgid: OrganizationID) {
		const { data } = await supabase
			.from('processes')
			.select('concern')
			.eq('orgid', orgid)
			.neq('concern', '');
		return data ? Array.from(new Set(data.map((process) => process.concern))) : null;
	}

	static async queryProcessByShortName(
		supabase: SupabaseClient<Database>,
		orgid: OrganizationID,
		name: string
	) {
		const { data } = await supabase
			.from('processes')
			.select('*')
			.eq('orgid', orgid)
			.contains('short', [name])
			.single();
		return data;
	}

	static async queryHows(supabase: SupabaseClient<Database>, orgid: OrganizationID) {
		return await supabase.from('hows').select('*').eq('orgid', orgid);
	}

	static async queryProcessHows(supabase: SupabaseClient<Database>, processid: ProcessID) {
		return supabase.from('hows').select('*').eq('processid', processid);
	}

	/** Create a new process, relying on Realtime for refresh */
	async addProcess(orgid: OrganizationID, title: string, visibility: Visibility) {
		const { data: processData, error } = await this.supabase
			.from('processes')
			.insert({ title, orgid, repeat: [] })
			.select()
			.single();

		if (error) return { error, id: null };

		const { data: newHow, error: howError } = await this.supabase
			.from('hows')
			.insert({ orgid, processid: processData.id, what: '', visibility })
			.select()
			.single();

		if (howError) return { error: howError, id: null };

		const { error: updateError } = await this.supabase
			.from('processes')
			.update({ howid: newHow.id })
			.eq('id', processData.id);
		if (updateError) return { error: updateError, id: null };

		this.notify(orgid);

		return { error, id: processData.id };
	}

	static getProcessHows(hows: HowRow[], id: ProcessID) {
		return hows.filter((how) => how.processid === id);
	}

	async updateProcessTitle(process: ProcessRow, title: string, who: PersonID) {
		const { error } = await this.supabase.from('processes').update({ title }).eq('id', process.id);
		if (error) return error;

		const comment = await this.addComment(
			process.orgid,
			who,
			`Updated process title to ${title}`,
			'processes',
			process.id,
			process.comments
		);

		this.notify(process.orgid);
		return comment;
	}

	async updateProcessShortName(process: ProcessRow, short: string) {
		const { error } = await this.supabase
			.from('processes')
			.update({ short: Array.from(new Set([short, ...process.short].filter((s) => s !== ''))) })
			.eq('id', process.id);
		this.notify(process.orgid);
		return error;
	}

	async updateProcessState(process: ProcessRow, state: State, who: PersonID) {
		const { error } = await this.supabase.from('processes').update({ state }).eq('id', process.id);
		if (error) return error;

		const comment = await this.addComment(
			process.orgid,
			who,
			`Updated state to ${state}`,
			'processes',
			process.id,
			process.comments
		);

		this.notify(process.orgid);
		return comment;
	}

	async addProcessPeriod(process: ProcessRow, period: Period) {
		const { error } = await this.supabase
			.from('processes')
			.update({ repeat: [...(process.repeat ? process.repeat : []), period] })
			.eq('id', process.id);

		this.notify(process.orgid);

		return error;
	}

	async updateProcessPeriod(process: ProcessRow, period: Period, index: number) {
		const repeat = process.repeat;
		if (process.repeat === null || repeat.length <= index) return null;
		const { error } = await this.supabase
			.from('processes')
			.update({
				repeat: [...repeat.slice(0, index), period, ...repeat.slice(index + 1)]
			})
			.eq('id', process.id);

		this.notify(process.orgid);

		return error;
	}

	async removeProcessPeriod(process: ProcessRow, index: number) {
		const repeat = process.repeat;
		if (process.repeat === null || repeat.length <= index || index < 0) return null;
		const { error } = await this.supabase
			.from('processes')
			.update({ repeat: repeat.filter((_, i) => i !== index) })
			.eq('id', process.id);

		this.notify(process.orgid);

		return error;
	}

	async updateProcessConcern(process: ProcessRow, concern: string, who: PersonID) {
		const { error } = await this.supabase
			.from('processes')
			.update({ concern })
			.eq('id', process.id);
		if (error) return error;

		const comment = this.addComment(
			process.orgid,
			who,
			`Updated concern to ${concern}`,
			'processes',
			process.id,
			process.comments
		);

		this.notify(process.orgid);
		return comment;
	}

	async renameConcern(orgid: OrganizationID, oldConcern: string, newConcern: string) {
		const { error } = await this.supabase
			.from('processes')
			.update({ concern: newConcern })
			.eq('orgid', orgid)
			.eq('concern', oldConcern);
		if (error) return error;
		this.notify(orgid);
		return null;
	}

	static getHowParent(hows: HowRow[], id: HowID) {
		return hows.find((how) => how.how.includes(id));
	}

	async createHow(process: ProcessRow, visibility: Visibility) {
		const how = await this.supabase
			.from('hows')
			.insert({ orgid: process.orgid, processid: process.id, what: '', visibility })
			.select()
			.single();

		this.notify(process.orgid);
		return how;
	}

	static getHow(hows: HowRow[], id: HowID) {
		return hows.find((how) => how.id === id);
	}

	async updateHowText(how: HowRow, text: Markup) {
		const { error } = await this.supabase.from('hows').update({ what: text }).eq('id', how.id);
		this.notify(how.orgid);
		return error;
	}

	async updateHowVisibility(how: HowRow, vis: Visibility) {
		const { error } = await this.supabase.from('hows').update({ visibility: vis }).eq('id', how.id);
		this.notify(how.orgid);
		return error;
	}

	async updateHowDone(how: HowRow, completion: Completion) {
		const { error } = await this.supabase
			.from('hows')
			.update({ done: completion })
			.eq('id', how.id);
		this.notify(how.orgid);
		return error;
	}

	async updateProcessAccountable(process: ProcessRow, role: RoleID | null) {
		const { error } = await this.supabase
			.from('processes')
			.update({ accountable: role })
			.eq('id', process.id);
		if (error) return error;
		this.notify(process.orgid);
		return null;
	}

	async addHowRCI(how: HowRow, role: RoleID, rci: 'responsible' | 'consulted' | 'informed') {
		const { error } = await this.supabase
			.from('hows')
			.update(
				rci === 'responsible'
					? { responsible: [...how.responsible, role] }
					: rci === 'consulted'
						? { consulted: [...how.consulted, role] }
						: { informed: [...how.informed, role] }
			)
			.eq('id', how.id);
		this.notify(how.orgid);
		return error;
	}

	async removeHowRCI(how: HowRow, role: RoleID, rci: 'responsible' | 'consulted' | 'informed') {
		const { error } = await this.supabase
			.from('hows')
			.update(
				rci === 'responsible'
					? { responsible: how.responsible.filter((r) => r !== role) }
					: rci === 'consulted'
						? { consulted: how.consulted.filter((c) => c !== role) }
						: { informed: how.informed.filter((i) => i !== role) }
			)
			.eq('id', how.id);
		this.notify(how.orgid);
		return error;
	}

	async insertHow(process: ProcessRow, visibility: Visibility, how: HowRow, index: number) {
		const { data: newHow, error: howError } = await this.createHow(process, visibility);
		if (howError) return { error: howError, id: null };
		const { error } = await this.supabase
			.from('hows')
			.update({ how: [...how.how.slice(0, index), newHow.id, ...how.how.slice(index)] })
			.eq('id', how.id);
		this.notify(process.orgid);
		return { error, id: newHow.id };
	}

	async reparentHow(how: HowRow, oldParent: HowRow, newParent: HowRow, index: number) {
		// Remove from the current parent
		const { error: oldError } = await this.supabase
			.from('hows')
			.update({ how: oldParent.how.filter((h) => h !== how.id) })
			.eq('id', oldParent.id);
		if (oldError) return oldError;
		// Insert in the new parent
		const { error: newError } = await this.supabase
			.from('hows')
			.update({ how: [...newParent.how.slice(0, index), how.id, ...newParent.how.slice(index)] })
			.eq('id', newParent.id);

		if (!newError) this.notify(how.orgid);

		return newError;
	}

	async moveHow(how: HowRow, parent: HowRow, index: number) {
		const hows = parent.how.filter((h) => h !== how.id);

		// Insert in the new parent
		const { error: newError } = await this.supabase
			.from('hows')
			.update({ how: [...hows.slice(0, index), how.id, ...hows.slice(index)] })
			.eq('id', parent.id);

		if (!newError) this.notify(how.orgid);

		return newError;
	}

	async deleteHow(parent: HowRow, how: HowRow) {
		// Remove the how from it's parent
		const { error: parentError } = await this.supabase
			.from('hows')
			.update({ how: parent.how.filter((howid) => howid !== how.id) })
			.eq('id', parent.id);
		if (parentError) return parentError;
		// Remove the how
		const { error: deleteError } = await this.supabase.from('hows').delete().eq('id', how.id);

		if (!deleteError) this.notify(how.orgid);
		return deleteError;
	}

	/** Delete this process, relying on Realtime for refresh. */
	async deleteProcess(id: ProcessID) {
		return await this.supabase.from('processes').delete().eq('id', id);
	}

	// Changes
	static async queryChanges(supabase: SupabaseClient<Database>, orgid: OrganizationID) {
		return supabase.from('suggestions').select('*').eq('orgid', orgid);
	}

	static async queryChange(supabase: SupabaseClient<Database>, changeid: ChangeID) {
		return supabase.from('suggestions').select('*').eq('id', changeid).single();
	}

	static async queryLeadChanges(
		supabase: SupabaseClient<Database>,
		orgid: OrganizationID,
		profileid: ProfileID
	) {
		return supabase.from('suggestions').select('*').eq('orgid', orgid).eq('lead', profileid);
	}

	static async queryProcessChanges(supabase: SupabaseClient<Database>, processid: ProcessID) {
		return supabase.from('suggestions').select('*').contains('processes', [processid]);
	}

	async createChange(
		who: PersonID,
		orgid: OrganizationID,
		what: string,
		description: Markup,
		visibility: Visibility,
		processes: ProcessID[],
		roles: RoleID[]
	) {
		// Insert
		return await this.supabase
			.from('suggestions')
			.insert({
				who,
				what,
				description,
				orgid: orgid,
				roles,
				visibility,
				processes,
				comments: []
			})
			.select()
			.single();
	}

	async updateChangeVisibility(change: ChangeRow, vis: string) {
		const { error } = await this.supabase
			.from('suggestions')
			.update({ visibility: vis as Visibility })
			.eq('id', change.id);

		if (!error) this.notify(change.orgid);
		return error;
	}

	async updateChangeLead(how: ChangeRow, lead: string | null) {
		const { error } = await this.supabase
			.from('suggestions')
			.update({ lead: lead })
			.eq('id', how.id);
		if (!error) this.notify(how.orgid);
		return error;
	}

	async updateChangeReview(change: ChangeRow, review: string | null) {
		const { error } = await this.supabase
			.from('suggestions')
			.update({ review: review })
			.eq('id', change.id);
		if (!error) this.notify(change.orgid);
		return error;
	}

	async udpateChangeWhat(change: ChangeRow, what: string) {
		if (change.what === what) return null;
		const { error } = await this.supabase.from('suggestions').update({ what }).eq('id', change.id);
		if (!error) this.notify(change.orgid);
		return error;
	}

	async updateChangeDescription(change: ChangeRow, description: string) {
		if (change.description === description) return null;
		const { error } = await this.supabase
			.from('suggestions')
			.update({ description })
			.eq('id', change.id);
		if (!error) this.notify(change.orgid);
		return error;
	}

	async updateChangeProposal(change: ChangeRow, proposal: string) {
		if (change.proposal === proposal) return null;
		const { error } = await this.supabase
			.from('suggestions')
			.update({ proposal })
			.eq('id', change.id);
		if (!error) this.notify(change.orgid);
		return error;
	}

	async updateChangeStatus(change: ChangeRow, status: Status, who: PersonID) {
		if (change.status === status) return null;
		const { error } = await this.supabase
			.from('suggestions')
			.update({ status })
			.eq('id', change.id);
		if (error) return error;

		const comment = this.addComment(
			change.orgid,
			who,
			`Updated status to ${status}`,
			'suggestions',
			change.id,
			change.comments
		);

		if (!error) this.notify(change.orgid);
		return comment;
	}

	async updateChangeRoles(change: ChangeRow, roles: RoleID[]) {
		const { error } = await this.supabase.from('suggestions').update({ roles }).eq('id', change.id);
		if (!error) this.notify(change.orgid);
		return error;
	}

	async updateChangeProcesses(change: ChangeRow, processes: ProcessID[]) {
		const { error } = await this.supabase
			.from('suggestions')
			.update({ processes })
			.eq('id', change.id);
		if (!error) this.notify(change.orgid);
		return error;
	}

	async deleteChange(id: ChangeID) {
		return await this.supabase.from('suggestions').delete().eq('id', id);
	}

	async getComments(ids: CommentID[]) {
		return await this.supabase.from('comments').select().in('id', ids);
	}

	async updateComment(comment: CommentRow, text: string) {
		const { error } = await this.supabase
			.from('comments')
			.update({ what: text })
			.eq('id', comment.id);
		if (!error) this.notify(comment.orgid);
		return error;
	}

	async deleteComment(
		process: ChangeRow | ProcessRow | RoleRow | OrganizationRow,
		table: 'processes' | 'suggestions' | 'roles' | 'orgs',
		comment: CommentID
	) {
		// Remove the comment from the process's comment list.
		const { error } = await this.supabase
			.from(table)
			.update({ comments: process.comments.filter((c) => c !== comment) })
			.eq('id', process.id);
		if (error) return error;
		const { error: deleteError } = await this.supabase.from('comments').delete().eq('id', comment);
		if (!deleteError) this.notify('orgid' in process ? process.orgid : process.id);
		return deleteError;
	}
}

export default Organization;
