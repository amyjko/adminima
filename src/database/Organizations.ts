import ReactiveMap from './ReactiveMap';
import Organization, {
	type ChangeID,
	type CommentID,
	type MarkupID,
	type OrganizationID,
	type PersonID,
	type ProcessID,
	type ProfileID,
	type RoleID,
	type TeamID
} from '$types/Organization';
import { supabase } from '$lib/supabaseClient';
import {
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
export type ChangeRow = Tables<'changes'>;
export type CommentRow = Tables<'comments'>;
export type Visibility = Database['public']['Enums']['visibility'];
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
	changes: ChangeRow[];
};

/** A front end interface to the backing store, caching data loaded from the database and offering operations for modifying the database. */
class Organizations {
	/** A collection of organization stores, kept in sync with the database for use by client */
	static readonly organizations = new ReactiveMap<OrganizationID, Organization>();

	/** Organization specific Supabase realtime channels */
	static readonly channels = new Map<OrganizationID, RealtimeChannel>();

	private static getOrgChannel(orgid: OrganizationID): string {
		return `orgs:${orgid}`;
	}

	/** Subscribe to an organization-specific channel, listening to all modifications to organization-related tables  */
	static subscribe(orgid: OrganizationID) {
		// See if there's a channel already.
		let channel = Organizations.channels.get(Organizations.getOrgChannel(orgid));

		// Already have a channel? No need to subscribe again.
		if (channel) return;

		// Otherwise, create a channel for this organization and listen to changes on it, keeping client-side model in sync with database.
		channel = supabase
			.channel(Organizations.getOrgChannel(orgid))
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
					const org = Organizations.organizations.get(orgid);
					if (!org) return;

					// Otherwise, update the organization.
					if (payload.eventType === 'UPDATE') {
						Organizations.organizations.set(orgid, org.withUpdate(payload.new));
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
					Organizations.synchronizeRow(
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
					Organizations.synchronizeRow(
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
					const org = Organizations.organizations.get(orgid);
					if (!org) return;

					// Otherwise, update the organization's profile.
					if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
						Organizations.organizations.set(orgid, org.withAssignment(payload.new));
					} else if (
						payload.eventType === 'DELETE' &&
						payload.old.roleid &&
						payload.old.profileid
					) {
						// Supabase doesn't allow filtering on delete events, so we have to filter here.
						Organizations.organizations.set(
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
					Organizations.synchronizeRow(
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
					Organizations.synchronizeRow(
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
					Organizations.synchronizeRow(
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
					table: 'changes',
					/** Only listen to rows for this organization id */
					filter: `orgid=eq.${orgid}`
				},
				(payload: RealtimePostgresChangesPayload<ChangeRow>) => {
					Organizations.synchronizeRow(
						orgid,
						payload,
						(org, change) => org.withChange(change),
						(org, change) => (change.id ? org.withoutChange(change.id) : org)
					);
				}
			)
			.subscribe();
	}

	private static synchronizeRow<T extends { [key: string]: unknown }>(
		orgid: OrganizationID,
		payload: RealtimePostgresChangesPayload<T>,
		update: (org: Organization, row: T) => Organization,
		remove: (org: Organization, row: Partial<T>) => Organization
	) {
		// Get the current object, if it exists.
		const org = Organizations.organizations.get(orgid);
		if (!org) return;

		// Otherwise, update the organization's profile.
		if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
			Organizations.organizations.set(orgid, update(org, payload.new));
		} else if (payload.eventType === 'DELETE' && payload.old.id) {
			// Supabase doesn't allow filtering on delete events, so we have to filter here.
			Organizations.organizations.set(orgid, remove(org, payload.old));
		}
	}

	/** Unsubscribe from the organization specific channel, if there is one. */
	static unsubscribe(orgid: OrganizationID) {
		const channel = Organizations.channels.get(Organizations.getOrgChannel(orgid));
		if (channel) supabase.removeChannel(channel);
	}

	/** Get markup from the database on demand */
	static async getMarkup(id: MarkupID) {
		const { data } = await supabase.from('markup').select().eq('id', id).single();
		return data?.text;
	}

	/** Update an organization's description. Rely on Realtime to refresh. */
	static async updateOrgDescription(
		org: Organization,
		text: string,
		who: PersonID
	): Promise<PostgrestError | null> {
		const markupError = await Organizations.addOrCreateMarkup(
			org.getDescription(),
			text,
			'orgs',
			org.getID()
		);
		if (markupError) return markupError;
		const commentError = await Organizations.addComment(
			org.getID(),
			who,
			'Updated organization description',
			'orgs',
			org.getID(),
			org.getComments()
		);
		return commentError;
	}

	static async updateOrgName(
		org: Organization,
		name: string,
		who: PersonID
	): Promise<PostgrestError | null> {
		const { error } = await supabase.from('orgs').update({ name: name }).eq('id', org.getID());
		if (error) return error;

		Organizations.addComment(
			org.getID(),
			who,
			`Updated organization name to ${name}`,
			'orgs',
			org.getID(),
			org?.getComments()
		);

		return null;
	}

	static async updateOrgVisibility(
		org: Organization,
		visibility: Visibility,
		who: PersonID
	): Promise<PostgrestError | null> {
		const { error } = await supabase.from('orgs').update({ visibility }).eq('id', org.getID());
		if (error) return error;

		Organizations.addComment(
			org.getID(),
			who,
			`Updated organization visibility to ${visibility}`,
			'orgs',
			org.getID(),
			org?.getComments()
		);

		return null;
	}

	static async createMarkup(text: string) {
		const { data } = await supabase.from('markup').insert({ text }).select().single();

		return data?.id ?? null;
	}

	/** Update admin status of a person. Rely on realtime to refresh. */
	static async updateAdmin(orgid: OrganizationID, profileid: ProfileID, admin: boolean) {
		await supabase.from('profiles').update({ admin }).eq('orgid', orgid).eq('id', profileid);
	}

	/** Add a person to the organization's profiles if not already added. Rely on Realtime notification for update. */
	static async addPersonByID(orgid: OrganizationID, person: PersonID | PersonRow) {
		const data = typeof person === 'string' ? await Organizations.getPerson(person) : person;
		if (!data) return null;
		await supabase
			.from('profiles')
			.insert({ orgid, personid: data.id, name: '', email: data.email, admin: false });
	}

	/** Add a person to the organization's profiles by email. Rely on Realtime notification for update. */
	static async addPersonByEmail(orgid: OrganizationID, email: string) {
		await supabase
			.from('profiles')
			.insert({ orgid, personid: null, name: '', email, admin: false });
	}

	static async assignPerson(orgid: OrganizationID, profileid: ProfileID, roleid: RoleID) {
		await supabase.from('assignments').insert({ orgid, profileid, roleid });
	}

	static async unassignPerson(orgid: OrganizationID, profileid: ProfileID, roleid: RoleID) {
		await supabase
			.from('assignments')
			.delete()
			.eq('orgid', orgid)
			.eq('profileid', profileid)
			.eq('roleid', roleid);
	}

	static async getPersonWithEmail(email: string) {
		const { data } = await supabase.from('people').select().eq('email', email).single();
		return data;
	}

	static async updateProfileSupervisor(
		orgid: OrganizationID,
		profileid: ProfileID,
		supervisor: PersonID | null
	) {
		await supabase
			.from('profiles')
			.update({ supervisor })
			.eq('orgid', orgid)
			.eq('personid', profileid);
	}

	/** Remove a perosn from the organization's profiles if included. Rely on Realtime notification for update. */
	static async removeProfile(profileid: ProfileID) {
		await supabase.from('profiles').delete().eq('id', profileid);
	}

	static updateOrg(org: OrganizationPayload) {
		return Organizations.organizations.set(org.organization.id, new Organization(org));
	}

	/** Reload an entire organization. Needed because Supabase realtime doesn't guarantee eventual message delivery. */
	static async refresh(orgid: OrganizationID) {
		const payload = await Organizations.getPayload(orgid);
		if (payload) Organizations.updateOrg(payload);
	}

	static async createRole(orgid: OrganizationID, title: string): Promise<RoleID | null> {
		const { data } = await supabase
			.from('roles')
			.insert({
				orgid: orgid,
				title
			})
			.select()
			.single();

		await Organizations.refresh(orgid);

		return data?.id ?? null;
	}

	static async updateRoleTitle(
		role: RoleRow,
		title: string,
		who: PersonID
	): Promise<PostgrestError | null> {
		const { error } = await supabase.from('roles').update({ title: title }).eq('id', role.id);
		if (error) return error;

		Organizations.addComment(
			role.orgid,
			who,
			`Updated role title to ${title}`,
			'roles',
			role.id,
			role.comments
		);

		return null;
	}

	static async updateRoleDescription(role: RoleRow, description: string, who: PersonID) {
		Organizations.addOrCreateMarkup(role.description, description, 'roles', role.id);
		Organizations.addComment(
			role.orgid,
			who,
			'Updated role description',
			'roles',
			role.id,
			role.comments
		);

		return null;
	}

	static async updateRoleTeam(role: RoleRow, team: TeamRow, who: PersonID) {
		const { error } = await supabase.from('roles').update({ team: team.id }).eq('id', role.id);
		if (error) return error;

		Organizations.addComment(
			role.orgid,
			who,
			`Updated role team to ${team.name}`,
			'roles',
			role.id,
			role.comments
		);

		return null;
	}

	static async updateProfileName(
		profile: ProfileRow,
		name: string
	): Promise<PostgrestError | null> {
		const { error } = await supabase
			.from('profiles')
			.update({ name })
			.eq('email', profile.email)
			.eq('orgid', profile.orgid);
		return error;
	}

	static async updateProfileDescription(profile: ProfileRow, text: string) {
		const markupID = profile.bio;
		// If we do, update it's text.
		if (markupID) {
			const { error } = await supabase.from('markup').update({ text }).eq('id', markupID);
			if (error) return error;
		}
		// Otherwise, create new markup and then update the org to point to it.
		else {
			const newMarkupID = await Organizations.createMarkup(text);
			if (newMarkupID === null) return null;
			const { error } = await supabase
				.from('profiles')
				.update({ bio: newMarkupID })
				.eq('email', profile.email)
				.eq('orgid', profile.orgid);
			if (error) return error;
		}
		return null;
	}

	static async addOrCreateMarkup(
		markupID: MarkupID | null,
		text: string,
		table: 'roles' | 'orgs' | 'profiles' | 'teams' | 'processes',
		id: string,
		idName: string = 'id'
	) {
		// If we do, update it's text.
		if (markupID) {
			const { error } = await supabase.from('markup').update({ text }).eq('id', markupID);
			if (error) return error;
		}
		// Otherwise, create new markup and then update the org to point to it.
		else {
			const newMarkupID = await Organizations.createMarkup(text);
			if (newMarkupID === null) return null;
			const { error } = await supabase
				.from(table)
				.update({ description: newMarkupID })
				.eq(idName, id);
			if (error) return error;
		}
	}

	static async addComment(
		orgid: OrganizationID,
		who: PersonID,
		what: string,
		table: 'orgs' | 'roles' | 'teams' | 'processes',
		id: string,
		comments: CommentID[]
	) {
		// Record that we edited it.
		const { data, error: insertError } = await supabase
			.from('comments')
			.insert({ orgid, what, who })
			.select()
			.single();
		if (insertError) return insertError;

		const commentID = data?.id ?? null;

		if (commentID) {
			const { error: updateError } = await supabase
				.from(table)
				.update({ comments: [...comments, commentID] })
				.eq('id', id);
			if (updateError) return updateError;
		}
		return null;
	}

	static async deleteRole(id: RoleID): Promise<PostgrestError | null> {
		const { error } = await supabase.from('roles').delete().eq('id', id);
		return error;
	}

	static async createTeam(orgid: OrganizationID, name: string): Promise<TeamID | null> {
		const { data } = await supabase
			.from('teams')
			.insert({
				orgid: orgid,
				name
			})
			.select()
			.single();

		return data?.id ?? null;
	}

	/** Update an organization's description. Rely on Realtime to refresh. */
	static async updateTeamDescription(
		team: TeamRow,
		text: string,
		who: PersonID
	): Promise<PostgrestError | null> {
		Organizations.addOrCreateMarkup(team.description, text, 'teams', team.id);
		Organizations.addComment(
			team.orgid,
			who,
			'Updated team description',
			'teams',
			team.id,
			team.comments
		);

		return null;
	}

	static async updateTeamName(
		team: TeamRow,
		name: string,
		who: PersonID
	): Promise<PostgrestError | null> {
		const { error } = await supabase.from('teams').update({ name }).eq('id', team.id);
		if (error) return error;

		Organizations.addComment(
			team.orgid,
			who,
			`Updated team name to ${name}`,
			'orgs',
			team.id,
			team.comments
		);

		return null;
	}

	static async deleteTeam(id: TeamID): Promise<PostgrestError | null> {
		const { error } = await supabase.from('teams').delete().eq('id', id);

		return error;
	}

	static async getPerson(id: PersonID): Promise<PersonRow | null> {
		const { data } = await supabase.from('people').select().eq('id', id).single();
		return data;
	}

	static async createOrganization(
		organizationName: string,
		adminID: PersonID,
		email: string,
		adminName: string
	) {
		// Create the new organization.
		const { data: org, error: orgError } = await supabase
			.from('orgs')
			.insert({
				name: organizationName,
				description: null
			})
			.select()
			.single();

		if (orgError) return { error: orgError, id: null };

		// Insert the new user profile
		const { error } = await supabase.from('profiles').insert({
			orgid: org.id,
			personid: adminID,
			email: email,
			name: adminName,
			admin: true
		});
		if (error) return { error, id: null };

		return { error: null, id: org.id };
	}

	static async getPayload(orgid: string): Promise<OrganizationPayload | null> {
		// Load all of the organization metadata from the database
		const { data: organization } = await supabase.from('orgs').select().eq('id', orgid).single();
		const { data: profiles } = await supabase.from('profiles').select(`*`).eq('orgid', orgid);
		const { data: roles } = await supabase.from('roles').select(`*`).eq('orgid', orgid);
		const { data: assignments } = await supabase.from('assignments').select(`*`).eq('orgid', orgid);
		const { data: processes } = await supabase.from('processes').select(`*`).eq('orgid', orgid);
		const { data: hows } = await supabase.from('hows').select(`*`).eq('orgid', orgid);
		const { data: teams } = await supabase.from('teams').select(`*`).eq('orgid', orgid);
		const { data: changes } = await supabase.from('changes').select(`*`).eq('orgid', orgid);

		// If we didn't receive any of it, return null. Otherwise, return the payload.
		return organization === null ||
			profiles === null ||
			roles === null ||
			assignments === null ||
			processes === null ||
			hows === null ||
			teams === null ||
			changes === null
			? null
			: {
					organization,
					profiles,
					roles,
					assignments,
					processes,
					hows,
					teams,
					changes
			  };
	}

	static async getPersonsOrganizations(
		personid: PersonID
	): Promise<{ id: string; name: string }[] | null> {
		const { data } = await supabase
			.from('orgs')
			.select(`id, name, profiles!profiles_orgid_fkey(personid)`)
			.not('profiles', 'is', null)
			.eq('profiles.personid', personid);
		return data ?? [];
	}

	/** Create a new process, relying on Realtime for refresh */
	static async addProcess(orgid: OrganizationID, title: string) {
		const { data, error } = await supabase
			.from('processes')
			.insert({ title, orgid })
			.select()
			.single();
		return { error, id: data?.id };
	}

	static async updateProcessTitle(process: ProcessRow, title: string, who: PersonID) {
		const { error } = await supabase.from('processes').update({ title }).eq('id', process.id);
		if (error) return error;

		Organizations.addComment(
			process.orgid,
			who,
			`Updated process title to ${title}`,
			'processes',
			process.id,
			process.comments
		);

		return null;
	}

	static async updateProcessConcern(process: ProcessRow, concern: string, who: PersonID) {
		const { error } = await supabase.from('processes').update({ concern }).eq('id', process.id);
		if (error) return error;

		Organizations.addComment(
			process.orgid,
			who,
			`Updated concern to ${concern}`,
			'processes',
			process.id,
			process.comments
		);

		return null;
	}

	static async updateProcessDescription(process: ProcessRow, description: Markup, who: PersonID) {
		const markupError = await Organizations.addOrCreateMarkup(
			process.description,
			description,
			'processes',
			process.id
		);
		if (markupError) return markupError;
		const commentError = await Organizations.addComment(
			process.orgid,
			who,
			'Updated process description',
			'processes',
			process.id,
			process.comments
		);
		return commentError;
	}

	/** Delete this process, relying on Realtime for refresh. */
	static async deleteProcess(id: ProcessID) {
		await supabase.from('processes').delete().eq('id', id);
	}

	static async createChange(
		who: PersonID,
		organization: OrganizationID,
		what: string,
		description: Markup,
		processes: ProcessID[],
		roles: RoleID[]
	) {
		// Make some markup
		const { data } = await supabase.from('markup').insert({ text: description }).select().single();

		if (data === null) return;
		// Insert
		const { data: change } = await supabase
			.from('changes')
			.insert({
				who,
				what,
				description: data.id,
				orgid: organization,
				roles,
				processes,
				comments: []
			})
			.select()
			.single();

		return change;
	}

	static async deleteChange(id: ChangeID) {
		await supabase.from('changes').delete().eq('id', id);
	}

	static async getComments(ids: CommentID[]) {
		const { data } = await supabase.from('comments').select().in('id', ids);
		return data ?? [];
	}
}

export default Organizations;
