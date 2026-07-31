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

/**
 * What every mutating method on Organization returns.
 *
 * One shape for all of them, so a single wrapper can report the error and refresh the page on
 * success. When methods returned three different shapes, the wrapper only fit some of them, and the
 * ones it didn't fit quietly went without a refresh — which is how mutations ended up depending on
 * a realtime notification that might never arrive.
 *
 * `data` is null for mutations that don't produce anything; creating methods return the new row or
 * its id.
 */
export type MutationResult<T = null> = { data: T | null; error: PostgrestError | null };

/** A mutation that produced nothing. */
export function ok<T = null>(error: PostgrestError | null = null): MutationResult<T> {
	return { data: null, error };
}

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

/**
 * The state of an organization's realtime connection, for the UI to report.
 *
 * 'connecting' covers the first subscription and every retry after it, and isn't worth telling
 * anyone about: mutations refresh explicitly, so a brief gap only delays other people's changes.
 * 'disconnected' means we've stopped retrying, and only a reload will bring live updates back.
 */
export type RealtimeStatus = 'connected' | 'connecting' | 'disconnected';

/** What we track about an organization's realtime connection, so we can retry when it drops. */
type Connection = {
	status: RealtimeStatus;
	/** Failed subscription attempts since the last successful one. */
	attempts: number;
	/** Whether the connection has dropped since it last succeeded, and so may have missed changes. */
	missed: boolean;
	/** The pending retry, if any. */
	timeout: ReturnType<typeof setTimeout> | null;
};

/** How a lost subscription is retried before we give up and let the UI say the page is stale. */
export type RetrySchedule = {
	/** How many retries to make before giving up. */
	attempts: number;
	/** How long to wait before the first retry; each subsequent one waits twice as long. */
	delay: number;
	/** The longest to wait between retries. */
	maxDelay: number;
};

/**
 * The schedule the app runs on. A failed attempt also spends the channel's join timeout, so five
 * retries mean roughly a minute and a half of quiet retrying before anything is said — patient by
 * design, since returning to the tab retries immediately anyway.
 */
const DefaultRetrySchedule: RetrySchedule = { attempts: 5, delay: 1000, maxDelay: 30000 };

/** Encapsulates functionality related to querying the database and manipulating organization data. */
class Organization {
	private supabase: SupabaseClient<Database>;

	/** A list of listeners to notify of realtime updates and connection status changes. */
	private listeners: {
		id: OrganizationID;
		listener: () => void;
		onStatus?: (status: RealtimeStatus) => void;
	}[] = [];

	/** Organization specific Supabase realtime channels, keyed by channel topic. */
	readonly channels = new Map<string, RealtimeChannel>();

	/** The state of each organization channel's connection, keyed by channel topic. */
	private connections = new Map<string, Connection>();

	/** How lost subscriptions are retried. Tests pass a faster schedule than the app's. */
	private readonly retry: RetrySchedule;

	constructor(supabase: SupabaseClient<Database>, retry: RetrySchedule = DefaultRetrySchedule) {
		this.supabase = supabase;
		this.retry = retry;
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

	/** Tell everyone listening to this organization how its realtime connection is doing. */
	private report(orgid: OrganizationID, status: RealtimeStatus) {
		const connection = this.connections.get(this.getOrgChannel(orgid));
		if (connection) connection.status = status;
		for (const listener of this.listeners) if (listener.id === orgid) listener.onStatus?.(status);
	}

	/**
	 * Subscribe to an organization-specific channel, listening to all modifications to organization-related tables.
	 * Pass onStatus to be told when the connection drops and when it comes back, so the UI can say
	 * so instead of silently going stale.
	 */
	listen(org: OrganizationRow, listener: () => void, onStatus?: (status: RealtimeStatus) => void) {
		const orgid = org.id;
		const topic = this.getOrgChannel(orgid);

		// Add the listener to the list of listeners.
		this.listeners.push({ id: orgid, listener, onStatus });

		// Already subscribed? No need to subscribe again; just say where things stand.
		const connection = this.connections.get(topic);
		if (connection) {
			onStatus?.(connection.status);
			return;
		}

		// Otherwise, subscribe, and remember the channel so we don't subscribe to the same topic
		// twice, and so we can remove it later.
		this.connections.set(topic, {
			status: 'connecting',
			attempts: 0,
			missed: false,
			timeout: null
		});
		onStatus?.('connecting');
		this.channels.set(topic, this.createOrgChannel(orgid));
	}

	/**
	 * Create and subscribe to an organization's channel, listening to changes on every
	 * organization-related table and keeping the client-side model in sync with the database.
	 */
	private createOrgChannel(orgid: OrganizationID): RealtimeChannel {
		return (
			this.supabase
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
				.subscribe((status) => {
					if (status === 'SUBSCRIBED') this.connected(orgid);
					else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') this.failed(orgid);
					// CLOSED is what removeChannel() produces when we tear a channel down or replace it,
					// so it isn't a failure.
				})
		);
	}

	/** A subscription succeeded. If it was a retry, catch up on what changed while we were away. */
	private connected(orgid: OrganizationID) {
		const connection = this.connections.get(this.getOrgChannel(orgid));
		if (connection === undefined) return;

		// Was there a gap to catch up on? Tracked separately from the retry count, which reconnect()
		// can reset — the longest gaps end in exactly that kind of reconnection.
		const missed = connection.missed;

		if (connection.timeout) clearTimeout(connection.timeout);
		connection.timeout = null;
		connection.attempts = 0;
		connection.missed = false;

		this.report(orgid, 'connected');
		if (missed) this.notify(orgid);
	}

	/** A subscription failed. Retry with backoff, and give up after enough tries so the UI can say so. */
	private failed(orgid: OrganizationID) {
		const connection = this.connections.get(this.getOrgChannel(orgid));
		if (connection === undefined) return;

		connection.attempts++;
		connection.missed = true;

		if (connection.timeout) clearTimeout(connection.timeout);
		connection.timeout = null;

		// Out of tries? Stop, and let the UI say the page is out of date.
		if (connection.attempts > this.retry.attempts) {
			this.report(orgid, 'disconnected');
			return;
		}

		this.report(orgid, 'connecting');
		connection.timeout = setTimeout(
			() => this.reconnect(orgid),
			Math.min(this.retry.delay * 2 ** (connection.attempts - 1), this.retry.maxDelay)
		);
	}

	/**
	 * Replace an organization's channel with a fresh one. A channel that errored can't be revived —
	 * subscribe() only rejoins a channel that's closed — so recovering means removing it and starting
	 * over. Pass reset to start the retry count over, as when someone returns to a long-idle tab.
	 */
	reconnect(orgid: OrganizationID, options?: { reset?: boolean }) {
		const topic = this.getOrgChannel(orgid);
		const connection = this.connections.get(topic);

		// Nobody listening, or nothing wrong? Nothing to do.
		if (connection === undefined || connection.status === 'connected') return;

		if (options?.reset) connection.attempts = 0;

		if (connection.timeout) clearTimeout(connection.timeout);
		connection.timeout = null;

		const channel = this.channels.get(topic);
		if (channel) this.supabase.removeChannel(channel);

		this.report(orgid, 'connecting');
		this.channels.set(topic, this.createOrgChannel(orgid));
	}

	/** Unsubscribe from the organization specific channel, if no one else is still listening to it. */
	ignore(orgid: OrganizationID, listener: () => void) {
		this.listeners = this.listeners.filter((l) => l.listener !== listener);

		// Others still listening to this organization? Keep the channel.
		if (this.listeners.some((l) => l.id === orgid)) return;

		const topic = this.getOrgChannel(orgid);

		// Stop any retry in flight; nobody's around to care anymore.
		const connection = this.connections.get(topic);
		if (connection?.timeout) clearTimeout(connection.timeout);
		this.connections.delete(topic);

		const channel = this.channels.get(topic);
		if (channel) {
			this.supabase.removeChannel(channel);
			this.channels.delete(topic);
		}
	}

	// Organizations

	/** Update an organization's description. Rely on Realtime to refresh. */
	async updateOrgDescription(
		org: OrganizationRow,
		text: string,
		who: PersonID
	): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('orgs')
			.update({ description: text })
			.eq('id', org.id);
		if (error) return ok(error);
		return await this.addComment(org.id, 'Updated organization description', 'orgs', org.id);
	}

	/** Update an organization's description. Rely on Realtime to refresh. */
	async addOrgPath(org: OrganizationRow, path: string): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('orgs')
			.update({ paths: [path, ...org.paths] })
			.eq('id', org.id);
		return ok(error);
	}

	async updateOrgPrompt(
		org: OrganizationRow,
		text: string,
		who: PersonID
	): Promise<MutationResult> {
		const { error } = await this.supabase.from('orgs').update({ prompt: text }).eq('id', org.id);
		if (error) return ok(error);
		return await this.addComment(org.id, 'Updated organization change prompt', 'orgs', org.id);
	}

	async updateOrgName(org: OrganizationRow, name: string, who: PersonID): Promise<MutationResult> {
		if (org.name === name) return ok();
		const { error } = await this.supabase.from('orgs').update({ name }).eq('id', org.id);
		if (error) return ok(error);

		await this.addComment(org.id, `Updated organization name to ${name}`, 'orgs', org.id);

		return ok();
	}

	async updateOrgVisibility(
		org: OrganizationRow,
		visibility: Visibility,
		who: PersonID
	): Promise<MutationResult> {
		const { error } = await this.supabase.from('orgs').update({ visibility }).eq('id', org.id);
		if (error) return ok(error);

		return await this.addComment(
			org.id,
			`Updated organization visibility to ${visibility}`,
			'orgs',
			org.id
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

	async updateProfileName(profile: ProfileRow, name: string): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('profiles')
			.update({ name })
			.eq('email', profile.email)
			.eq('orgid', profile.orgid);
		return ok(error);
	}

	async updateProfileBio(profile: ProfileRow, text: string): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('profiles')
			.update({ bio: text })
			.eq('email', profile.email)
			.eq('orgid', profile.orgid);
		return ok(error);
	}

	/** Update admin status of a person. Rely on realtime to refresh. */
	async updateAdmin(
		orgid: OrganizationID,
		profileid: ProfileID,
		admin: boolean
	): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('profiles')
			.update({ admin })
			.eq('orgid', orgid)
			.eq('id', profileid);
		return ok(error);
	}

	/** Add a person to the organization's profiles if not already added. Rely on Realtime notification for update. */
	/**
	 * Add a person to the organization's profiles by email. If the email already has an account, the
	 * on_profile_create trigger links the new profile to that person.
	 */
	async addPersonByEmail(
		orgid: OrganizationID,
		email: string,
		name: string | undefined
	): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('profiles')
			.insert({ orgid, personid: null, name: name ?? '', email, admin: false });
		return ok(error);
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

	async assignPerson(
		orgid: OrganizationID,
		profileid: ProfileID,
		roleid: RoleID
	): Promise<MutationResult> {
		const { error } = await this.supabase.from('assignments').insert({ orgid, profileid, roleid });
		return ok(error);
	}

	async unassignPerson(
		orgid: OrganizationID,
		profileid: ProfileID,
		roleid: RoleID
	): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('assignments')
			.delete()
			.eq('orgid', orgid)
			.eq('profileid', profileid)
			.eq('roleid', roleid);

		// No error? Update the organization on the front end.
		if (error === null) this.notify(orgid);

		return ok(error);
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
	): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('profiles')
			.update({ supervisor })
			.eq('orgid', orgid)
			.eq('id', profileid);
		return ok(error);
	}

	/** Remove a perosn from the organization's profiles if included. Rely on Realtime notification for update. */
	async removeProfile(profileid: ProfileID): Promise<MutationResult> {
		const { error } = await this.supabase.from('profiles').delete().eq('id', profileid);
		return ok(error);
	}

	async createRole(orgid: OrganizationID, title: string): Promise<MutationResult<RoleRow>> {
		const { data, error } = await this.supabase
			.from('roles')
			.insert({
				orgid: orgid,
				title
			})
			.select()
			.single();
		return { data: error ? null : data, error };
	}

	async updateRoleTitle(role: RoleRow, title: string, who: PersonID): Promise<MutationResult> {
		const { error } = await this.supabase.from('roles').update({ title: title }).eq('id', role.id);
		if (error) return ok(error);

		return await this.addComment(role.orgid, `Updated role title to ${title}`, 'roles', role.id);
	}

	async updateRoleDescription(
		role: RoleRow,
		description: string,
		who: PersonID
	): Promise<MutationResult> {
		const { error } = await this.supabase.from('roles').update({ description }).eq('id', role.id);
		if (error) return ok(error);
		return await this.addComment(role.orgid, 'Updated role description', 'roles', role.id);
	}

	async updateRoleTeam(
		role: RoleRow,
		team: TeamID | null,
		name: string | undefined,
		who: PersonID
	): Promise<MutationResult> {
		const { error } = await this.supabase.from('roles').update({ team }).eq('id', role.id);
		if (error) return ok(error);

		return await this.addComment(
			role.orgid,
			name ? `Updated role team to ${name}` : `Removed role from team`,
			'roles',
			role.id
		);
	}

	async updateRoleShortName(role: RoleRow, short: string): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('roles')
			.update({ short: Array.from(new Set([short, ...role.short].filter((s) => s !== ''))) })
			.eq('id', role.id);
		return ok(error);
	}

	// Comments

	/**
	 * Add a comment to an organization, role, team, process, or change.
	 *
	 * This goes through the add_comment function rather than inserting and then linking, because
	 * linking is an UPDATE on the parent row and most parents only allow admins (or the author) to
	 * update them. Doing it here would silently orphan any comment left by an ordinary member, since
	 * an update that matches no rows is not an error. The function also appends atomically, so
	 * concurrent comments can't overwrite each other.
	 */
	async addComment(
		orgid: OrganizationID,
		what: string,
		table: 'orgs' | 'roles' | 'teams' | 'processes' | 'suggestions',
		id: string
	): Promise<MutationResult> {
		const { error } = await this.supabase.rpc('add_comment', {
			_orgid: orgid,
			_what: what,
			_table: table,
			_id: id
		});
		if (error) return ok(error);

		this.notify(orgid);
		return ok();
	}

	async deleteRole(orgid: OrganizationID, id: RoleID): Promise<MutationResult> {
		// Remove role from any hows that reference them in responsible, consulted, or informed lists.

		const { data, error: howError } = await this.supabase.from('hows').select().eq('orgid', orgid);
		if (howError) return ok(howError);

		for (const how of data) {
			if (how.responsible.includes(id)) {
				const { error: updateError } = await this.supabase
					.from('hows')
					.update({ responsible: how.responsible.filter((r: string) => r !== id) })
					.eq('id', how.id);
				if (updateError) return ok(updateError);
			}
			if (how.consulted.includes(id)) {
				const { error: updateError } = await this.supabase
					.from('hows')
					.update({ consulted: how.consulted.filter((r: string) => r !== id) })
					.eq('id', how.id);
				if (updateError) return ok(updateError);
			}
			if (how.informed.includes(id)) {
				const { error: updateError } = await this.supabase
					.from('hows')
					.update({ informed: how.informed.filter((r: string) => r !== id) })
					.eq('id', how.id);
				if (updateError) return ok(updateError);
			}
		}

		const { error } = await this.supabase.from('roles').delete().eq('id', id);
		return ok(error);
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

	async createTeam(orgid: OrganizationID, name: string): Promise<MutationResult<TeamRow>> {
		const { data, error } = await this.supabase
			.from('teams')
			.insert({
				orgid: orgid,
				name
			})
			.select()
			.single();
		return { data: error ? null : data, error };
	}

	/** Update an organization's description. Rely on Realtime to refresh. */
	async updateTeamDescription(team: TeamRow, text: string, who: PersonID): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('teams')
			.update({ description: text })
			.eq('id', team.id);
		if (error) return ok(error);
		return await this.addComment(team.orgid, 'Updated team description', 'teams', team.id);
	}

	async updateTeamName(team: TeamRow, name: string, who: PersonID): Promise<MutationResult> {
		const { error } = await this.supabase.from('teams').update({ name }).eq('id', team.id);
		if (error) return ok(error);

		const comment = await this.addComment(
			team.orgid,
			`Updated team name to ${name}`,
			'teams',
			team.id
		);

		if (!comment.error) this.notify(team.orgid);

		return comment;
	}

	async deleteTeam(id: TeamID): Promise<MutationResult> {
		const { error } = await this.supabase.from('teams').delete().eq('id', id);
		if (!error) this.notify(id);
		return ok(error);
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
	): Promise<MutationResult<OrganizationID>> {
		const { data, error } = await this.supabase.rpc('create_org', {
			adminname: adminName,
			orgname: orgName,
			invite: invite,
			uid,
			email
		});
		return { data: data ?? null, error };
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
	async addProcess(
		orgid: OrganizationID,
		title: string,
		visibility: Visibility
	): Promise<MutationResult<ProcessID>> {
		const { data: processData, error } = await this.supabase
			.from('processes')
			.insert({ title, orgid, repeat: [] })
			.select()
			.single();

		if (error) return { data: null, error };

		const { data: newHow, error: howError } = await this.supabase
			.from('hows')
			.insert({ orgid, processid: processData.id, what: '', visibility })
			.select()
			.single();

		if (howError) return { data: null, error: howError };

		const { error: updateError } = await this.supabase
			.from('processes')
			.update({ howid: newHow.id })
			.eq('id', processData.id);
		if (updateError) return { data: null, error: updateError };

		this.notify(orgid);

		return { data: processData.id, error };
	}

	static getProcessHows(hows: HowRow[], id: ProcessID) {
		return hows.filter((how) => how.processid === id);
	}

	async updateProcessTitle(
		process: ProcessRow,
		title: string,
		who: PersonID
	): Promise<MutationResult> {
		const { error } = await this.supabase.from('processes').update({ title }).eq('id', process.id);
		if (error) return ok(error);

		const comment = await this.addComment(
			process.orgid,
			`Updated process title to ${title}`,
			'processes',
			process.id
		);

		this.notify(process.orgid);
		return comment;
	}

	async updateProcessShortName(process: ProcessRow, short: string): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('processes')
			.update({ short: Array.from(new Set([short, ...process.short].filter((s) => s !== ''))) })
			.eq('id', process.id);
		this.notify(process.orgid);
		return ok(error);
	}

	async updateProcessState(
		process: ProcessRow,
		state: State,
		who: PersonID
	): Promise<MutationResult> {
		const { error } = await this.supabase.from('processes').update({ state }).eq('id', process.id);
		if (error) return ok(error);

		const comment = await this.addComment(
			process.orgid,
			`Updated state to ${state}`,
			'processes',
			process.id
		);

		this.notify(process.orgid);
		return comment;
	}

	async addProcessPeriod(process: ProcessRow, period: Period): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('processes')
			.update({ repeat: [...(process.repeat ? process.repeat : []), period] })
			.eq('id', process.id);

		this.notify(process.orgid);

		return ok(error);
	}

	async updateProcessPeriod(
		process: ProcessRow,
		period: Period,
		index: number
	): Promise<MutationResult> {
		const repeat = process.repeat;
		if (process.repeat === null || repeat.length <= index) return ok();
		const { error } = await this.supabase
			.from('processes')
			.update({
				repeat: [...repeat.slice(0, index), period, ...repeat.slice(index + 1)]
			})
			.eq('id', process.id);

		this.notify(process.orgid);

		return ok(error);
	}

	async removeProcessPeriod(process: ProcessRow, index: number): Promise<MutationResult> {
		const repeat = process.repeat;
		if (process.repeat === null || repeat.length <= index || index < 0) return ok();
		const { error } = await this.supabase
			.from('processes')
			.update({ repeat: repeat.filter((_, i) => i !== index) })
			.eq('id', process.id);

		this.notify(process.orgid);

		return ok(error);
	}

	async updateProcessConcern(
		process: ProcessRow,
		concern: string,
		who: PersonID
	): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('processes')
			.update({ concern })
			.eq('id', process.id);
		if (error) return ok(error);

		const comment = await this.addComment(
			process.orgid,
			`Updated concern to ${concern}`,
			'processes',
			process.id
		);

		this.notify(process.orgid);
		return comment;
	}

	async renameConcern(
		orgid: OrganizationID,
		oldConcern: string,
		newConcern: string
	): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('processes')
			.update({ concern: newConcern })
			.eq('orgid', orgid)
			.eq('concern', oldConcern);
		if (error) return ok(error);
		this.notify(orgid);
		return ok();
	}

	static getHowParent(hows: HowRow[], id: HowID) {
		return hows.find((how) => how.how.includes(id));
	}

	async createHow(process: ProcessRow, visibility: Visibility): Promise<MutationResult<HowRow>> {
		const { data, error } = await this.supabase
			.from('hows')
			.insert({ orgid: process.orgid, processid: process.id, what: '', visibility })
			.select()
			.single();

		this.notify(process.orgid);
		return { data: error ? null : data, error };
	}

	static getHow(hows: HowRow[], id: HowID) {
		return hows.find((how) => how.id === id);
	}

	async updateHowText(how: HowRow, text: Markup): Promise<MutationResult> {
		const { error } = await this.supabase.from('hows').update({ what: text }).eq('id', how.id);
		this.notify(how.orgid);
		return ok(error);
	}

	async updateHowVisibility(how: HowRow, vis: Visibility): Promise<MutationResult> {
		const { error } = await this.supabase.from('hows').update({ visibility: vis }).eq('id', how.id);
		this.notify(how.orgid);
		return ok(error);
	}

	async updateHowDone(how: HowRow, completion: Completion): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('hows')
			.update({ done: completion })
			.eq('id', how.id);
		this.notify(how.orgid);
		return ok(error);
	}

	async updateProcessAccountable(
		process: ProcessRow,
		role: RoleID | null
	): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('processes')
			.update({ accountable: role })
			.eq('id', process.id);
		if (error) return ok(error);
		this.notify(process.orgid);
		return ok();
	}

	async addHowRCI(
		how: HowRow,
		role: RoleID,
		rci: 'responsible' | 'consulted' | 'informed'
	): Promise<MutationResult> {
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
		return ok(error);
	}

	async removeHowRCI(
		how: HowRow,
		role: RoleID,
		rci: 'responsible' | 'consulted' | 'informed'
	): Promise<MutationResult> {
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
		return ok(error);
	}

	async insertHow(
		process: ProcessRow,
		visibility: Visibility,
		how: HowRow,
		index: number
	): Promise<MutationResult<HowID>> {
		const { data: newHow, error: howError } = await this.createHow(process, visibility);
		if (howError || newHow === null) return { data: null, error: howError };
		const { error } = await this.supabase
			.from('hows')
			.update({ how: [...how.how.slice(0, index), newHow.id, ...how.how.slice(index)] })
			.eq('id', how.id);
		this.notify(process.orgid);
		return { data: newHow.id, error };
	}

	async reparentHow(
		how: HowRow,
		oldParent: HowRow,
		newParent: HowRow,
		index: number
	): Promise<MutationResult> {
		// Remove from the current parent
		const { error: oldError } = await this.supabase
			.from('hows')
			.update({ how: oldParent.how.filter((h) => h !== how.id) })
			.eq('id', oldParent.id);
		if (oldError) return ok(oldError);
		// Insert in the new parent
		const { error: newError } = await this.supabase
			.from('hows')
			.update({ how: [...newParent.how.slice(0, index), how.id, ...newParent.how.slice(index)] })
			.eq('id', newParent.id);

		if (!newError) this.notify(how.orgid);

		return ok(newError);
	}

	async moveHow(how: HowRow, parent: HowRow, index: number): Promise<MutationResult> {
		const hows = parent.how.filter((h) => h !== how.id);

		// Insert in the new parent
		const { error: newError } = await this.supabase
			.from('hows')
			.update({ how: [...hows.slice(0, index), how.id, ...hows.slice(index)] })
			.eq('id', parent.id);

		if (!newError) this.notify(how.orgid);

		return ok(newError);
	}

	async deleteHow(parent: HowRow, how: HowRow): Promise<MutationResult> {
		// Remove the how from it's parent
		const { error: parentError } = await this.supabase
			.from('hows')
			.update({ how: parent.how.filter((howid) => howid !== how.id) })
			.eq('id', parent.id);
		if (parentError) return ok(parentError);
		// Remove the how
		const { error: deleteError } = await this.supabase.from('hows').delete().eq('id', how.id);

		if (!deleteError) this.notify(how.orgid);
		return ok(deleteError);
	}

	/** Delete this process, relying on Realtime for refresh. */
	async deleteProcess(id: ProcessID): Promise<MutationResult> {
		const { error } = await this.supabase.from('processes').delete().eq('id', id);
		return ok(error);
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
	): Promise<MutationResult<ChangeRow>> {
		// Insert
		const { data, error } = await this.supabase
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
		return { data: error ? null : data, error };
	}

	async updateChangeVisibility(change: ChangeRow, vis: string): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('suggestions')
			.update({ visibility: vis as Visibility })
			.eq('id', change.id);

		if (!error) this.notify(change.orgid);
		return ok(error);
	}

	async updateChangeLead(how: ChangeRow, lead: string | null): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('suggestions')
			.update({ lead: lead })
			.eq('id', how.id);
		if (!error) this.notify(how.orgid);
		return ok(error);
	}

	async updateChangeReview(change: ChangeRow, review: string | null): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('suggestions')
			.update({ review: review })
			.eq('id', change.id);
		if (!error) this.notify(change.orgid);
		return ok(error);
	}

	async udpateChangeWhat(change: ChangeRow, what: string): Promise<MutationResult> {
		if (change.what === what) return ok();
		const { error } = await this.supabase.from('suggestions').update({ what }).eq('id', change.id);
		if (!error) this.notify(change.orgid);
		return ok(error);
	}

	async updateChangeDescription(change: ChangeRow, description: string): Promise<MutationResult> {
		if (change.description === description) return ok();
		const { error } = await this.supabase
			.from('suggestions')
			.update({ description })
			.eq('id', change.id);
		if (!error) this.notify(change.orgid);
		return ok(error);
	}

	async updateChangeProposal(change: ChangeRow, proposal: string): Promise<MutationResult> {
		if (change.proposal === proposal) return ok();
		const { error } = await this.supabase
			.from('suggestions')
			.update({ proposal })
			.eq('id', change.id);
		if (!error) this.notify(change.orgid);
		return ok(error);
	}

	async updateChangeStatus(
		change: ChangeRow,
		status: Status,
		who: PersonID
	): Promise<MutationResult> {
		if (change.status === status) return ok();
		const { error } = await this.supabase
			.from('suggestions')
			.update({ status })
			.eq('id', change.id);
		if (error) return ok(error);

		const comment = await this.addComment(
			change.orgid,
			`Updated status to ${status}`,
			'suggestions',
			change.id
		);

		if (!error) this.notify(change.orgid);
		return comment;
	}

	async updateChangeRoles(change: ChangeRow, roles: RoleID[]): Promise<MutationResult> {
		const { error } = await this.supabase.from('suggestions').update({ roles }).eq('id', change.id);
		if (!error) this.notify(change.orgid);
		return ok(error);
	}

	async updateChangeProcesses(change: ChangeRow, processes: ProcessID[]): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('suggestions')
			.update({ processes })
			.eq('id', change.id);
		if (!error) this.notify(change.orgid);
		return ok(error);
	}

	async deleteChange(id: ChangeID): Promise<MutationResult> {
		const { error } = await this.supabase.from('suggestions').delete().eq('id', id);
		return ok(error);
	}

	async getComments(ids: CommentID[]) {
		return await this.supabase.from('comments').select().in('id', ids);
	}

	async updateComment(comment: CommentRow, text: string): Promise<MutationResult> {
		const { error } = await this.supabase
			.from('comments')
			.update({ what: text })
			.eq('id', comment.id);
		if (!error) this.notify(comment.orgid);
		return ok(error);
	}

	async deleteComment(
		process: ChangeRow | ProcessRow | RoleRow | OrganizationRow,
		table: 'processes' | 'suggestions' | 'roles' | 'orgs',
		comment: CommentID
	): Promise<MutationResult> {
		// Unlinking and deleting go together in delete_comment: done separately under the caller's own
		// permissions, a caller allowed to update the parent but not delete the comment would unlink it
		// and then fail, hiding someone else's comment while leaving the row behind.
		const orgid = 'orgid' in process ? process.orgid : process.id;
		const { error } = await this.supabase.rpc('delete_comment', {
			_orgid: orgid,
			_table: table,
			_id: process.id,
			_commentid: comment
		});
		if (error) return ok(error);

		this.notify(orgid);
		return ok();
	}
}

export default Organization;
