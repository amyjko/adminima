import ReactiveMap from './ReactiveMap';
import Organization, {
	type SuggestionID,
	type CommentID,
	type OrganizationID,
	type PersonID,
	type ProcessID,
	type ProfileID,
	type RoleID,
	type TeamID
} from '$types/Organization';
import {
	type SupabaseClient,
	type PostgrestError,
	type RealtimeChannel,
	type RealtimePostgresChangesPayload
} from '@supabase/supabase-js';
import type { Database, Tables } from './database.types';
import { type Markup } from '$types/Organization';

export type PersonRow = Tables<'people'>;
export type OrganizationRow = Tables<'orgs'>;
export type RoleRow = Tables<'roles'>;
export type ProfileRow = Tables<'profiles'>;
export type AssignmentRow = Tables<'assignments'>;
export type ProcessRow = Tables<'processes'>;
export type TeamRow = Tables<'teams'>;
export type HowRow = Tables<'hows'>;
export type SuggestionRow = Tables<'suggestions'>;
export type CommentRow = Tables<'comments'>;
export type Visibility = Database['public']['Enums']['visibility'];
export type Completion = Database['public']['Enums']['completion'];
export type Status = Database['public']['Enums']['status'];

/** A serializable version of all organization data, used to store raw data from the database. */
export type OrganizationPayload = {
	organization: OrganizationRow;
	profiles: ProfileRow[];
	roles: RoleRow[];
	assignments: AssignmentRow[];
	teams: TeamRow[];
	processes: ProcessRow[];
	hows: HowRow[];
	suggestions: SuggestionRow[];
};

/** A front end interface to the backing store, caching data loaded from the database and offering operations for modifying the database. */
class OrganizationsDB {
	private supabase: SupabaseClient;

	/** A collection of organization stores, kept in sync with the database for use by client */
	readonly organizations = new ReactiveMap<OrganizationID, Organization>();

	/** Organization specific Supabase realtime channels */
	readonly channels = new Map<OrganizationID, RealtimeChannel>();

	constructor(supabase: SupabaseClient) {
		this.supabase = supabase;
	}

	async getUser() {
		return this.supabase.auth.getUser();
	}

	signOut() {
		return this.supabase.auth.signOut();
	}

	setSupabaseClient(client: SupabaseClient) {
		this.supabase = client;
	}

	private getOrgChannel(orgid: OrganizationID): string {
		return `orgs:${orgid}`;
	}

	updateOrg(org: OrganizationPayload) {
		return this.organizations.set(org.organization.id, new Organization(org));
	}

	/** Reload an entire organization. Needed because Supabase realtime doesn't guarantee eventual message delivery. */
	async refresh(orgid: OrganizationID) {
		const payload = await this.getPayload(orgid);
		if (payload) this.updateOrg(payload);
	}

	async getPayload(orgid: string): Promise<OrganizationPayload | null> {
		// First find the org that has the id or the path.
		const result = await this.supabase.from('orgs').select().eq('id', orgid).single();

		let { data: organization } = result;

		if (organization === null) {
			const { data: pathOrganization, error: pathError } = await this.supabase
				.from('orgs')
				.select()
				.contains('paths', [orgid])
				.single();

			if (pathError) {
				console.log(pathError);
				return null;
			}

			organization = pathOrganization;
		}

		if (organization === null) return null;

		// Did we match on a path and not an id? Update the orgid to the actual id.
		if (organization.id !== orgid) orgid = organization.id;

		// Load all of the organization metadata from the database
		const [
			{ data: profiles, error: profileError },
			{ data: roles, error: rolesError },
			{ data: assignments, error: assignmentsError },
			{ data: processes, error: processesError },
			{ data: hows, error: howError },
			{ data: teams, error: teamsError },
			{ data: suggestions, error: suggestionsError }
		] = await Promise.all([
			this.supabase.from('profiles').select(`*`).eq('orgid', orgid),
			this.supabase.from('roles').select(`*`).eq('orgid', orgid),
			this.supabase.from('assignments').select(`*`).eq('orgid', orgid),
			this.supabase.from('processes').select(`*`).eq('orgid', orgid),
			this.supabase.from('hows').select(`*`).eq('orgid', orgid),
			this.supabase.from('teams').select(`*`).eq('orgid', orgid),
			this.supabase.from('suggestions').select(`*`).eq('orgid', orgid)
		]);

		// If we didn't receive any of it, return null.
		if (
			organization === null ||
			profiles === null ||
			roles === null ||
			assignments === null ||
			processes === null ||
			hows === null ||
			teams === null ||
			suggestions === null
		) {
			console.log('Missing something');
			console.log(
				rolesError ??
					profileError ??
					assignmentsError ??
					processesError ??
					howError ??
					teamsError ??
					suggestionsError
			);

			return null;
		}

		// Otherwise, return the payload.
		else
			return {
				organization,
				profiles,
				roles,
				assignments,
				processes,
				hows,
				teams,
				suggestions
			};
	}
	/** Subscribe to an organization-specific channel, listening to all modifications to organization-related tables  */
	subscribe(orgid: OrganizationID) {
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
					// Get the current object, if it exists.
					const org = this.organizations.get(orgid);
					if (!org) return;

					// Otherwise, update the organization.
					if (payload.eventType === 'UPDATE') {
						this.organizations.set(orgid, org.withUpdate(payload.new));
					}
				}
			)
			/** When a profile for this organization changes, update it's client-side store. */
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'profiles',
					/** Only listen to rows for this organization id */
					filter: `orgid=eq.${orgid}`
				},
				(payload: RealtimePostgresChangesPayload<ProfileRow>) => {
					this.synchronizeRow(
						orgid,
						payload,
						(org, role) => org.withProfile(role),
						(org, role) => (role.id ? org.withoutProfile(role.id) : org)
					);
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
				(payload: RealtimePostgresChangesPayload<RoleRow>) => {
					this.synchronizeRow(
						orgid,
						payload,
						(org, role) => org.withRole(role),
						(org, role) => (role.id ? org.withoutRole(role.id) : org)
					);
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
				(payload: RealtimePostgresChangesPayload<AssignmentRow>) => {
					const org = this.organizations.get(orgid);
					if (!org) return;

					// Otherwise, update the organization's profile.
					if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
						this.organizations.set(orgid, org.withAssignment(payload.new));
					} else if (
						payload.eventType === 'DELETE' &&
						payload.old.roleid &&
						payload.old.profileid
					) {
						// Supabase doesn't allow filtering on delete events, so we have to filter here.
						this.organizations.set(
							orgid,
							org.withoutAssignment(payload.old.roleid, payload.old.profileid)
						);
					}
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
				(payload: RealtimePostgresChangesPayload<TeamRow>) => {
					this.synchronizeRow(
						orgid,
						payload,
						(org, newTeam) => org.withTeam(newTeam),
						(org, team) => (team.id ? org.withoutTeam(team.id) : org)
					);
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
				(payload: RealtimePostgresChangesPayload<ProcessRow>) => {
					this.synchronizeRow(
						orgid,
						payload,
						(org, newProcess) => org.withProcess(newProcess),
						(org, process) => (process.id ? org.withoutProcess(process.id) : org)
					);
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
				(payload: RealtimePostgresChangesPayload<HowRow>) => {
					this.synchronizeRow(
						orgid,
						payload,
						(org, how) => org.withHow(how),
						(org, how) => (how.id ? org.withoutHow(how.id) : org)
					);
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
				(payload: RealtimePostgresChangesPayload<SuggestionRow>) => {
					this.synchronizeRow(
						orgid,
						payload,
						(org, suggestion) => org.withSuggestion(suggestion),
						(org, suggestion) => (suggestion.id ? org.withoutChange(suggestion.id) : org)
					);
				}
			)
			.subscribe();
	}

	private synchronizeRow<T extends { [key: string]: unknown }>(
		orgid: OrganizationID,
		payload: RealtimePostgresChangesPayload<T>,
		update: (org: Organization, row: T) => Organization,
		remove: (org: Organization, row: Partial<T>) => Organization
	) {
		// Get the current object, if it exists.
		const org = this.organizations.get(orgid);
		if (!org) return;

		// Otherwise, update the organization's profile.
		if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
			this.organizations.set(orgid, update(org, payload.new));
		} else if (payload.eventType === 'DELETE' && payload.old.id) {
			// Supabase doesn't allow filtering on delete events, so we have to filter here.
			this.organizations.set(orgid, remove(org, payload.old));
		}
	}

	/** Unsubscribe from the organization specific channel, if there is one. */
	unsubscribe(orgid: OrganizationID) {
		const channel = this.channels.get(this.getOrgChannel(orgid));
		if (channel) this.supabase.removeChannel(channel);
	}

	/** Update an organization's description. Rely on Realtime to refresh. */
	async updateOrgDescription(
		org: Organization,
		text: string,
		who: PersonID
	): Promise<PostgrestError | null> {
		const { error } = await this.supabase
			.from('orgs')
			.update({ description: text })
			.eq('id', org.getID());
		if (error) return error;
		const commentError = await this.addComment(
			org.getID(),
			who,
			'Updated organization description',
			'orgs',
			org.getID(),
			org.getComments()
		);
		return commentError;
	}

	/** Update an organization's description. Rely on Realtime to refresh. */
	async addOrgPath(org: Organization, path: string): Promise<PostgrestError | null> {
		const { error } = await this.supabase
			.from('orgs')
			.update({ paths: [path, ...org.getPaths()] })
			.eq('id', org.getID());
		return error;
	}

	async updateOrgPrompt(
		org: Organization,
		text: string,
		who: PersonID
	): Promise<PostgrestError | null> {
		const { error } = await this.supabase
			.from('orgs')
			.update({ prompt: text })
			.eq('id', org.getID());
		if (error) return error;
		const commentError = await this.addComment(
			org.getID(),
			who,
			'Updated organization suggestion prompt',
			'orgs',
			org.getID(),
			org.getComments()
		);
		return commentError;
	}

	async updateOrgName(
		org: Organization,
		name: string,
		who: PersonID
	): Promise<PostgrestError | null> {
		if (org.getName() === name) return null;
		const { error } = await this.supabase.from('orgs').update({ name }).eq('id', org.getID());
		if (error) return error;

		this.addComment(
			org.getID(),
			who,
			`Updated organization name to ${name}`,
			'orgs',
			org.getID(),
			org?.getComments()
		);

		return null;
	}

	async updateOrgVisibility(
		org: Organization,
		visibility: Visibility,
		who: PersonID
	): Promise<PostgrestError | null> {
		const { error } = await this.supabase.from('orgs').update({ visibility }).eq('id', org.getID());
		if (error) return error;

		return await this.addComment(
			org.getID(),
			who,
			`Updated organization visibility to ${visibility}`,
			'orgs',
			org.getID(),
			org?.getComments()
		);
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
	async addPersonByEmail(orgid: OrganizationID, email: string) {
		const { error } = await this.supabase
			.from('profiles')
			.insert({ orgid, personid: null, name: '', email, admin: false });
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
		return error;
	}

	async getPersonWithEmail(email: string) {
		const { data } = await this.supabase.from('people').select().eq('email', email).single();
		return data;
	}

	async updateProfileSupervisor(
		orgid: OrganizationID,
		profileid: ProfileID,
		supervisor: PersonID | null
	) {
		const { error } = await this.supabase
			.from('profiles')
			.update({ supervisor })
			.eq('orgid', orgid)
			.eq('personid', profileid);
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

	async addComment(
		orgid: OrganizationID,
		who: PersonID,
		what: string,
		table: 'orgs' | 'roles' | 'teams' | 'processes' | 'suggestions',
		id: string,
		comments: CommentID[]
	) {
		// Record that we edited it.
		const { data, error: insertError } = await this.supabase
			.from('comments')
			.insert({ orgid, what, who })
			.select()
			.single();
		if (insertError) return insertError;

		const commentID = data?.id ?? null;

		if (commentID) {
			const { error: updateError } = await this.supabase
				.from(table)
				.update({ comments: [...comments, commentID] })
				.eq('id', id);
			return updateError;
		} else return null;
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

		return this.addComment(
			team.orgid,
			who,
			`Updated team name to ${name}`,
			'orgs',
			team.id,
			team.comments
		);
	}

	async deleteTeam(id: TeamID): Promise<PostgrestError | null> {
		const { error } = await this.supabase.from('teams').delete().eq('id', id);
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

	/** Create a new process, relying on Realtime for refresh */
	async addProcess(orgid: OrganizationID, title: string) {
		const { data: processData, error } = await this.supabase
			.from('processes')
			.insert({ title, orgid })
			.select()
			.single();

		if (error) return { error, id: null };

		const { data: newHow, error: howError } = await this.supabase
			.from('hows')
			.insert({ orgid, processid: processData.id, what: '' })
			.select()
			.single();

		if (howError) return { error: howError, id: null };

		const { error: updateError } = await this.supabase
			.from('processes')
			.update({ howid: newHow.id })
			.eq('id', processData.id);
		if (updateError) return { error: updateError, id: null };
		return { error, id: processData.id };
	}

	async updateProcessTitle(process: ProcessRow, title: string, who: PersonID) {
		const { error } = await this.supabase.from('processes').update({ title }).eq('id', process.id);
		if (error) return error;

		return this.addComment(
			process.orgid,
			who,
			`Updated process title to ${title}`,
			'processes',
			process.id,
			process.comments
		);
	}

	async updateProcessConcern(process: ProcessRow, concern: string, who: PersonID) {
		const { error } = await this.supabase
			.from('processes')
			.update({ concern })
			.eq('id', process.id);
		if (error) return error;

		return this.addComment(
			process.orgid,
			who,
			`Updated concern to ${concern}`,
			'processes',
			process.id,
			process.comments
		);
	}

	async createHow(process: ProcessRow) {
		return await this.supabase
			.from('hows')
			.insert({ orgid: process.orgid, processid: process.id, what: '' })
			.select()
			.single();
	}

	async updateHowText(how: HowRow, text: Markup) {
		const { error } = await this.supabase.from('hows').update({ what: text }).eq('id', how.id);
		return error;
	}

	async updateHowVisibility(how: HowRow, vis: Visibility) {
		const { error } = await this.supabase.from('hows').update({ visibility: vis }).eq('id', how.id);
		return error;
	}

	async updateHowDone(how: HowRow, completion: Completion) {
		const { error } = await this.supabase
			.from('hows')
			.update({ done: completion })
			.eq('id', how.id);
		return error;
	}

	async updateProcessAccountable(process: ProcessRow, role: RoleID | null) {
		const { error } = await this.supabase
			.from('processes')
			.update({ accountable: role })
			.eq('id', process.id);
		return error;
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
		return error;
	}

	async insertHow(process: ProcessRow, how: HowRow, index: number) {
		const { data: newHow, error: howError } = await this.createHow(process);
		if (howError) return { error: howError, id: null };
		const { error } = await this.supabase
			.from('hows')
			.update({ how: [...how.how.slice(0, index), newHow.id, ...how.how.slice(index)] })
			.eq('id', how.id);
		return { error, id: newHow.id };
	}

	async moveHow(how: HowRow, oldParent: HowRow, newParent: HowRow, index: number) {
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

		return deleteError;
	}

	/** Delete this process, relying on Realtime for refresh. */
	async deleteProcess(id: ProcessID) {
		return await this.supabase.from('processes').delete().eq('id', id);
	}

	async createSuggestion(
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

	async updateSuggestionVisibility(how: SuggestionRow, vis: string) {
		const { error } = await this.supabase
			.from('suggestions')
			.update({ visibility: vis })
			.eq('id', how.id);
		return error;
	}

	async updateSuggestionWhat(suggestion: SuggestionRow, what: string) {
		if (suggestion.what === what) return null;
		const { error } = await this.supabase
			.from('suggestions')
			.update({ what })
			.eq('id', suggestion.id);
		return error;
	}

	async updateSuggestionDescription(suggestion: SuggestionRow, description: string) {
		if (suggestion.description === description) return null;
		const { error } = await this.supabase
			.from('suggestions')
			.update({ description })
			.eq('id', suggestion.id);
		return error;
	}

	async updateSuggestionProposal(suggestion: SuggestionRow, proposal: string) {
		if (suggestion.proposal === proposal) return null;
		const { error } = await this.supabase
			.from('suggestions')
			.update({ proposal })
			.eq('id', suggestion.id);
		return error;
	}

	async updateSuggestionStatus(suggestion: SuggestionRow, status: Status, who: PersonID) {
		if (suggestion.status === status) return null;
		const { error } = await this.supabase
			.from('suggestions')
			.update({ status })
			.eq('id', suggestion.id);
		if (error) return error;

		return this.addComment(
			suggestion.orgid,
			who,
			`Updated status to ${status}`,
			'suggestions',
			suggestion.id,
			suggestion.comments
		);
	}

	async updateSuggestionRoles(suggestion: SuggestionRow, roles: RoleID[]) {
		const { error } = await this.supabase
			.from('suggestions')
			.update({ roles })
			.eq('id', suggestion.id);
		return error;
	}

	async updateSuggestionProcesses(suggestion: SuggestionRow, processes: ProcessID[]) {
		const { error } = await this.supabase
			.from('suggestions')
			.update({ processes })
			.eq('id', suggestion.id);
		return error;
	}

	async deleteSuggestion(id: SuggestionID) {
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
		return error;
	}

	async deleteComment(
		process: SuggestionRow | ProcessRow | RoleRow | OrganizationRow,
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
		return deleteError;
	}
}

export default OrganizationsDB;
