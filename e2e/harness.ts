import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import Organization from '../src/database/Organization';
import type Database from '../src/database/Database';

/**
 * Shared setup for end-to-end tests that run against the local Supabase stack.
 *
 * These tests exercise the real Organization class against a real database, so they cover
 * PostgREST, row level security, and the triggers that link profiles to people — none of which
 * a mocked client would catch.
 *
 * Start the stack with `npx supabase start` before running.
 */

export const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
export const ANON_KEY =
	process.env.SUPABASE_ANON_KEY ??
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
export const SERVICE_KEY =
	process.env.SUPABASE_SERVICE_ROLE_KEY ??
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const PASSWORD = 'test-password-123';

/** A service-role client. Bypasses RLS — use only for setup, assertions, and teardown. */
export const admin: SupabaseClient<Database> = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
	auth: { autoRefreshToken: false, persistSession: false }
});

/** A signed-out client, for asserting what anonymous callers can and cannot do. */
export function anonClient(): SupabaseClient<Database> {
	return createClient<Database>(SUPABASE_URL, ANON_KEY, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
}

export type TestPerson = {
	id: string;
	email: string;
	client: SupabaseClient<Database>;
	/** The Organization API bound to this person's authenticated client. */
	db: Organization;
	/** This person's profile in the test org, when they are a member. */
	profileid: string;
};

export type TestOrg = {
	id: string;
	/** Created the org via create_org, so admin = true. */
	admin: TestPerson;
	/** A non-admin member of the org. */
	member: TestPerson;
	/** Authenticated, but not a member of the org. */
	outsider: TestPerson;
};

/** Everything created by a test, so it can be torn down in the right order. */
const createdUsers: string[] = [];
const createdOrgs: string[] = [];

function unique(prefix: string) {
	return `${prefix}-${uuid().slice(0, 8)}@example.com`;
}

/** Create a confirmed auth user and return a client already signed in as them. */
export async function createPerson(prefix = 'person'): Promise<TestPerson> {
	const email = unique(prefix);
	const { data, error } = await admin.auth.admin.createUser({
		email,
		password: PASSWORD,
		email_confirm: true
	});
	if (error) throw new Error(`createUser failed: ${error.message}`);
	const id = data.user.id;
	createdUsers.push(id);

	const client = createClient<Database>(SUPABASE_URL, ANON_KEY, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
	const { error: signInError } = await client.auth.signInWithPassword({
		email,
		password: PASSWORD
	});
	if (signInError) throw new Error(`signIn failed: ${signInError.message}`);

	return { id, email, client, db: new Organization(client), profileid: '' };
}

/**
 * Create an organization with an admin, a plain member, and an unrelated outsider.
 *
 * The org is created through the real `create_org` RPC (which burns an invite), so this exercises
 * the same bootstrap path the app uses rather than inserting rows behind RLS.
 */
export async function createTestOrg(name = 'E2E Org'): Promise<TestOrg> {
	const [adminPerson, memberPerson, outsider] = await Promise.all([
		createPerson('admin'),
		createPerson('member'),
		createPerson('outsider')
	]);

	// create_org requires an unused invite; only the service role can create one.
	const invite = uuid();
	const { error: inviteError } = await admin.from('invites').insert({ id: invite, used: false });
	if (inviteError) throw new Error(`invite insert failed: ${inviteError.message}`);

	const { data: orgid, error: createError } = await adminPerson.db.createOrganization(
		name,
		'Admin',
		invite,
		adminPerson.id,
		adminPerson.email
	);
	if (createError !== null || typeof orgid !== 'string')
		throw new Error(`create_org failed: ${JSON.stringify(createError ?? orgid)}`);
	createdOrgs.push(orgid);

	// Add the member. addPersonByEmail relies on the on_profile_create trigger to link the account.
	const { error: addError } = await adminPerson.db.addPersonByEmail(
		orgid,
		memberPerson.email,
		'Member'
	);
	if (addError) throw new Error(`addPersonByEmail failed: ${addError.message}`);

	adminPerson.profileid = await profileIdFor(orgid, adminPerson.id);
	memberPerson.profileid = await profileIdFor(orgid, memberPerson.id);

	return { id: orgid, admin: adminPerson, member: memberPerson, outsider };
}

/** Look up a person's profile id in an org, via the service role so RLS can't hide it. */
export async function profileIdFor(orgid: string, personid: string): Promise<string> {
	const { data, error } = await admin
		.from('profiles')
		.select('id')
		.eq('orgid', orgid)
		.eq('personid', personid)
		.single();
	if (error) throw new Error(`profile lookup failed: ${error.message}`);
	return data.id;
}

/** Read a row as the service role, bypassing RLS, to assert what actually landed in the database. */
export async function readRow<T extends keyof Database['public']['Tables']>(
	table: T,
	id: string
): Promise<Database['public']['Tables'][T]['Row'] | null> {
	const { data } = await admin.from(table).select('*').eq('id', id).maybeSingle();
	return data as Database['public']['Tables'][T]['Row'] | null;
}

/** Remove everything created during the run. Orgs cascade to their child rows. */
export async function cleanup() {
	for (const orgid of createdOrgs.splice(0)) {
		await admin.from('orgs').delete().eq('id', orgid);
	}
	for (const userid of createdUsers.splice(0)) {
		await admin.auth.admin.deleteUser(userid);
	}
}

/** Assert a bare error value is null. For raw PostgREST results and destructured errors. */
export function expectNoError(error: { message: string } | null, context: string) {
	if (error) throw new Error(`${context}: ${error.message}`);
}

/** Assert a mutation succeeded, given the uniform { data, error } every Organization mutation returns. */
export function expectOk(result: { error: { message: string } | null }, context: string) {
	expectNoError(result.error, context);
}
