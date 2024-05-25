import ReactiveMap from './ReactiveMap';
import Organization, {
	type ChangeID,
	type CommentID,
	type OrganizationID,
	type PersonID,
	type ProcessID,
	type RoleID
} from '$types/Organization';
import { supabase } from '$lib/supabaseClient';
import type {
	PostgrestError,
	RealtimeChannel,
	RealtimePostgresChangesPayload
} from '@supabase/supabase-js';
import type { Database, Tables } from './database.types';
import { type Markup } from '$types/Organization';

export type OrganizationRow = Tables<'orgs'>;
export type RoleRow = Tables<'roles'>;
export type ProfileRow = Tables<'profiles'>;
export type AssignmentRow = Tables<'assignments'>;
export type ProcessRow = Tables<'processes'>;
export type TeamRow = Tables<'teams'>;
export type HowRow = Tables<'hows'>;
export type ChangeRow = Tables<'changes'>;
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
						(org, role) => (role.personid ? org.withoutProfile(role.personid) : org)
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
					Organizations.synchronizeRow(
						orgid,
						payload,
						(org, assignment) => org.withAssignment(assignment),
						(org, assignment) =>
							assignment.roleid && assignment.personid
								? org.withoutAssignment(assignment.roleid, assignment.personid)
								: org
					);
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

	/** Update an organization's description. Rely on Realtime to refresh. */
	static async updateDescription(orgid: OrganizationID, description: string) {
		await supabase.from('orgs').update({ description }).eq('id', orgid);
	}

	/** Update admin status of a person. Rely on realtime to refresh. */
	static async updateAdmin(orgid: OrganizationID, personid: PersonID, admin: boolean) {
		await supabase.from('profiles').update({ admin }).eq('orgid', orgid).eq('personid', personid);
	}

	/** Add a person to the organization's profiles if not already added. Rely on Realtime notification for update. */
	static async addPerson(orgid: OrganizationID, personid: PersonID) {
		await supabase.from('profiles').insert({ orgid, personid, name: '', admin: false });
	}

	/** Remove a perosn from the organization's profiles if included. Rely on Realtime notification for update. */
	static async removePerson(orgid: OrganizationID, personid: PersonID) {
		await supabase.from('profiles').delete().eq('orgid', orgid).eq('personid', personid);
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
				title,
				description: ''
			})
			.select()
			.single();

		await Organizations.refresh(orgid);

		return data?.id ?? null;
	}

	static async deleteRole(orgid: OrganizationID, id: RoleID): Promise<PostgrestError | null> {
		const { error } = await supabase.from('roles').delete().eq('id', id);
		if (error) return error;
		else {
			Organizations.refresh(orgid);
			return null;
		}
	}

	static async createOrganization(organizationName: string, admin: PersonID, adminName: string) {
		// Insert the new organization
		const { data: org, error } = await supabase
			.from('orgs')
			.insert({
				name: organizationName,
				description: null
			})
			.select()
			.single();
		if (error) return { error, id: null };
		else {
			// Insert the new user profile
			const { error } = await supabase.from('profiles').insert({
				orgid: org.id,
				personid: admin,
				name: adminName,
				admin: true
			});
			if (error) return { error, id: null };

			return { error: null, id: org.id };
		}
	}

	static async updateOrganizationName(
		orgid: OrganizationID,
		name: string
	): Promise<PostgrestError | null> {
		const { error } = await supabase.from('orgs').update({ name: name }).eq('id', orgid);
		if (error) return error;
		else {
			await Organizations.refresh(orgid);
			return null;
		}
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
