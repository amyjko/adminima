import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import Organization, { type ProfileRow, type RoleRow } from '../src/database/Organization';
import {
	admin,
	anonClient,
	cleanup,
	createPerson,
	createTestOrg,
	expectNoError,
	expectOk,
	profileIdFor,
	readRow,
	type TestOrg,
	type TestPerson
} from './harness';

let org: TestOrg;

/** An account whose profile is added with a differently-cased email, to test trigger linking. */
let casedPerson: TestPerson;
let casedProfileID: string;

/** An account whose profile is added with no name, to test the name-or-email fallbacks. */
let blankPerson: TestPerson;
let blankProfileID: string;

/** An email with no account behind it, to test that profiles can exist unlinked. */
let ghostEmail: string;
let ghostProfileID: string;

let role: RoleRow;

/** All profiles in the org, as the admin sees them. Refreshed by `profiles()`. */
async function profiles(): Promise<ProfileRow[]> {
	const { data, error } = await Organization.queryProfiles(org.admin.client, org.id);
	expectNoError(error, 'queryProfiles');
	return data ?? [];
}

async function assignments() {
	const { data, error } = await Organization.queryAssignments(org.admin.client, org.id);
	expectNoError(error, 'queryAssignments');
	return data ?? [];
}

/** Read a profile row directly, bypassing RLS, so assertions see the true database state. */
async function profileRow(id: string): Promise<ProfileRow> {
	const row = await readRow('profiles', id);
	if (row === null) throw new Error(`no profile ${id}`);
	return row;
}

/** Insert a fresh, unlinked profile via the service role and return its id. */
async function throwawayProfile(prefix: string): Promise<string> {
	const { data, error } = await admin
		.from('profiles')
		.insert({
			orgid: org.id,
			personid: null,
			name: prefix,
			email: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
			admin: false
		})
		.select()
		.single();
	if (error) throw new Error(`throwawayProfile failed: ${error.message}`);
	return data.id;
}

async function assignmentExists(profileid: string, roleid: string): Promise<boolean> {
	const { data } = await admin
		.from('assignments')
		.select('*')
		.eq('orgid', org.id)
		.eq('profileid', profileid)
		.eq('roleid', roleid);
	return (data?.length ?? 0) > 0;
}

beforeAll(async () => {
	org = await createTestOrg('Profile CRUD');

	// A person whose profile is added with the email in a different case than the account.
	casedPerson = await createPerson('cased');
	expectOk(
		await org.admin.db.addPersonByEmail(org.id, casedPerson.email.toUpperCase(), 'Cased'),
		'addPersonByEmail (cased)'
	);
	const { data: casedRow } = await admin
		.from('profiles')
		.select('id')
		.eq('orgid', org.id)
		.eq('email', casedPerson.email.toUpperCase())
		.single();
	casedProfileID = casedRow!.id;

	// A person added with no name at all, so name falls back to email in the display helpers.
	blankPerson = await createPerson('blank');
	expectOk(
		await org.admin.db.addPersonByEmail(org.id, blankPerson.email, undefined),
		'addPersonByEmail (blank)'
	);
	blankProfileID = await profileIdFor(org.id, blankPerson.id);

	// An email with no account. The profile should exist but stay unlinked.
	ghostEmail = `ghost-${Date.now()}@example.com`;
	expectOk(
		await org.admin.db.addPersonByEmail(org.id, ghostEmail, 'Ghost'),
		'addPersonByEmail (ghost)'
	);
	const { data: ghostRow } = await admin
		.from('profiles')
		.select('id')
		.eq('orgid', org.id)
		.eq('email', ghostEmail)
		.single();
	ghostProfileID = ghostRow!.id;

	const { data: roleData, error: roleError } = await org.admin.db.createRole(org.id, 'Tester');
	expectNoError(roleError, 'createRole');
	role = roleData!;
});

afterAll(cleanup);

describe('profile queries', () => {
	it('queryProfiles returns every profile in the org and nothing from other orgs', async () => {
		const { data, error } = await Organization.queryProfiles(org.admin.client, org.id);
		expect(error).toBeNull();

		const ids = data!.map((p) => p.id);
		expect(ids).toContain(org.admin.profileid);
		expect(ids).toContain(org.member.profileid);
		expect(ids).toContain(casedProfileID);
		expect(ids).toContain(blankProfileID);
		expect(ids).toContain(ghostProfileID);
		expect(data!.every((p) => p.orgid === org.id)).toBe(true);

		// Matches what the service role sees, so nothing is hidden or invented.
		const { count } = await admin
			.from('profiles')
			.select('*', { count: 'exact', head: true })
			.eq('orgid', org.id);
		expect(data!.length).toBe(count);
	});

	it('queryProfile returns the single requested profile', async () => {
		const { data, error } = await Organization.queryProfile(
			org.admin.client,
			org.id,
			org.member.profileid
		);
		expect(error).toBeNull();
		expect(data?.id).toBe(org.member.profileid);
		expect(data?.email).toBe(org.member.email);
		expect(data?.personid).toBe(org.member.id);
	});

	it('queryProfile errors when the profile is not in the given org', async () => {
		const { data, error } = await Organization.queryProfile(
			org.admin.client,
			org.id,
			// A well-formed id that is not a profile in this org.
			org.id
		);
		expect(data).toBeNull();
		expect(error).not.toBeNull();
	});

	it('getPersonProfile finds a person profile by person id', async () => {
		const profile = await org.admin.db.getPersonProfile(org.id, org.member.id);
		expect(profile?.id).toBe(org.member.profileid);
		expect(profile?.email).toBe(org.member.email);
	});

	it('getPersonProfile returns null for a person with no profile in the org', async () => {
		expect(await org.admin.db.getPersonProfile(org.id, org.outsider.id)).toBeNull();
	});

	it('getPerson returns the signed-in person from the people table', async () => {
		const { data, error } = await org.member.db.getPerson(org.member.id);
		expect(error).toBeNull();
		expect(data?.id).toBe(org.member.id);
		expect(data?.email).toBe(org.member.email);
	});

	it('getPerson cannot read someone else, since people are only visible to themselves', async () => {
		// Confirm the row genuinely exists before asserting RLS is what hides it.
		const { data: real } = await admin.from('people').select('*').eq('id', org.admin.id).single();
		expect(real?.id).toBe(org.admin.id);

		const { data, error } = await org.member.db.getPerson(org.admin.id);
		expect(data).toBeNull();
		expect(error).not.toBeNull();
	});
});

describe('addPersonByEmail', () => {
	it('creates a profile and links personid when the email already has an account', async () => {
		const row = await profileRow(blankProfileID);
		expect(row.email).toBe(blankPerson.email);
		expect(row.personid).toBe(blankPerson.id);
		expect(row.admin).toBe(false);
		expect(row.name).toBe('');
	});

	it('links personid even when the email case differs from the account', async () => {
		const row = await profileRow(casedProfileID);
		expect(row.email).toBe(casedPerson.email.toUpperCase());
		expect(row.email).not.toBe(casedPerson.email);
		// The on_profile_create trigger matches on lower(email), so it still links.
		expect(row.personid).toBe(casedPerson.id);
	});

	it('leaves personid null when the email has no account', async () => {
		const row = await profileRow(ghostProfileID);
		expect(row.email).toBe(ghostEmail);
		expect(row.personid).toBeNull();
		expect(row.name).toBe('Ghost');
	});

	it('links a pre-existing unlinked profile when that email later signs up', async () => {
		const email = `later-${Date.now()}@example.com`;
		expectOk(await org.admin.db.addPersonByEmail(org.id, email, 'Later'), 'addPersonByEmail');
		const { data: created } = await admin
			.from('profiles')
			.select('id')
			.eq('orgid', org.id)
			.eq('email', email)
			.single();
		expect((await profileRow(created!.id)).personid).toBeNull();

		// The on_auth_user_created trigger backfills personid when the account appears.
		const { data: user, error } = await admin.auth.admin.createUser({
			email,
			password: 'test-password-123',
			email_confirm: true
		});
		expectNoError(error, 'createUser');
		expect((await profileRow(created!.id)).personid).toBe(user.user.id);

		await admin.auth.admin.deleteUser(user.user.id);
	});
});

describe('profile updates', () => {
	it('updateProfileName renames a profile', async () => {
		const before = await profileRow(org.member.profileid);
		expectOk(await org.admin.db.updateProfileName(before, 'Renamed Member'), 'updateProfileName');
		expect((await profileRow(org.member.profileid)).name).toBe('Renamed Member');
	});

	it('a person can rename their own profile', async () => {
		const before = await profileRow(org.member.profileid);
		expectOk(
			await org.member.db.updateProfileName(before, 'Self Renamed'),
			'updateProfileName (self)'
		);
		expect((await profileRow(org.member.profileid)).name).toBe('Self Renamed');
	});

	it('updateProfileBio sets a bio', async () => {
		const before = await profileRow(org.member.profileid);
		expectOk(await org.admin.db.updateProfileBio(before, 'A short bio'), 'updateProfileBio');
		expect((await profileRow(org.member.profileid)).bio).toBe('A short bio');
	});

	it('a person can update their own bio', async () => {
		const before = await profileRow(org.member.profileid);
		expectOk(await org.member.db.updateProfileBio(before, 'My own bio'), 'updateProfileBio (self)');
		expect((await profileRow(org.member.profileid)).bio).toBe('My own bio');
	});

	it('updateAdmin promotes and demotes a member', async () => {
		expect((await profileRow(org.member.profileid)).admin).toBe(false);

		expectOk(await org.admin.db.updateAdmin(org.id, org.member.profileid, true), 'promote');
		expect((await profileRow(org.member.profileid)).admin).toBe(true);

		expectOk(await org.admin.db.updateAdmin(org.id, org.member.profileid, false), 'demote');
		expect((await profileRow(org.member.profileid)).admin).toBe(false);
	});

	it('updateProfileSupervisor sets and clears a supervisor', async () => {
		expectOk(
			await org.admin.db.updateProfileSupervisor(org.id, org.member.profileid, org.admin.profileid),
			'set supervisor'
		);
		expect((await profileRow(org.member.profileid)).supervisor).toBe(org.admin.profileid);

		expectOk(
			await org.admin.db.updateProfileSupervisor(org.id, org.member.profileid, null),
			'clear supervisor'
		);
		expect((await profileRow(org.member.profileid)).supervisor).toBeNull();
	});

	it('removeProfile deletes a profile', async () => {
		const email = `removable-${Date.now()}@example.com`;
		expectOk(await org.admin.db.addPersonByEmail(org.id, email, 'Removable'), 'addPersonByEmail');
		const { data: created } = await admin
			.from('profiles')
			.select('id')
			.eq('orgid', org.id)
			.eq('email', email)
			.single();
		expect(await readRow('profiles', created!.id)).not.toBeNull();

		expectOk(await org.admin.db.removeProfile(created!.id), 'removeProfile');
		expect(await readRow('profiles', created!.id)).toBeNull();
	});
});

describe('assignments', () => {
	it('assignPerson creates an assignment', async () => {
		expectOk(
			await org.admin.db.assignPerson(org.id, org.member.profileid, role.id),
			'assignPerson'
		);
		expect(await assignmentExists(org.member.profileid, role.id)).toBe(true);
	});

	it('queryAssignments lists the org assignments', async () => {
		const { data, error } = await Organization.queryAssignments(org.admin.client, org.id);
		expect(error).toBeNull();
		expect(data!.some((a) => a.profileid === org.member.profileid && a.roleid === role.id)).toBe(
			true
		);
		expect(data!.every((a) => a.orgid === org.id)).toBe(true);
	});

	it('queryPersonRoles returns the roleids a person is assigned', async () => {
		const { data } = await Organization.queryPersonRoles(org.admin.client, org.id, org.member.id);
		expect(data!.map((a) => a.roleid)).toContain(role.id);
	});

	it('queryPersonRoles returns nothing for a person with no assignments', async () => {
		const { data } = await Organization.queryPersonRoles(org.admin.client, org.id, org.outsider.id);
		expect(data).toEqual([]);
	});

	it('queryPersonRoles short-circuits to an empty list for a null person', async () => {
		const { data } = await Organization.queryPersonRoles(org.admin.client, org.id, null);
		expect(data).toEqual([]);
	});

	it('unassignPerson removes the assignment', async () => {
		expect(await assignmentExists(org.member.profileid, role.id)).toBe(true);
		expectOk(
			await org.admin.db.unassignPerson(org.id, org.member.profileid, role.id),
			'unassignPerson'
		);
		expect(await assignmentExists(org.member.profileid, role.id)).toBe(false);
	});

	it('deleting a profile cascades to its assignments', async () => {
		const email = `assigned-${Date.now()}@example.com`;
		expectOk(await org.admin.db.addPersonByEmail(org.id, email, 'Assigned'), 'addPersonByEmail');
		const { data: created } = await admin
			.from('profiles')
			.select('id')
			.eq('orgid', org.id)
			.eq('email', email)
			.single();
		expectOk(await org.admin.db.assignPerson(org.id, created!.id, role.id), 'assignPerson');
		expect(await assignmentExists(created!.id, role.id)).toBe(true);

		expectOk(await org.admin.db.removeProfile(created!.id), 'removeProfile');
		expect(await assignmentExists(created!.id, role.id)).toBe(false);
	});
});

describe('static helpers over real data', () => {
	it('getAdmins, hasAdminProfile and getAdminCount reflect the admin flags in the database', async () => {
		const all = await profiles();
		const admins = Organization.getAdmins(all);

		const { data: actual } = await admin
			.from('profiles')
			.select('id')
			.eq('orgid', org.id)
			.eq('admin', true);
		expect(admins.map((p) => p.id).sort()).toEqual(actual!.map((p) => p.id).sort());

		expect(Organization.getAdminCount(all)).toBe(actual!.length);
		expect(Organization.hasAdminProfile(all, org.admin.profileid)).toBe(true);
		expect(Organization.hasAdminProfile(all, org.member.profileid)).toBe(false);
	});

	it('getAdminCount tracks a promotion and demotion', async () => {
		const before = Organization.getAdminCount(await profiles());

		expectOk(await org.admin.db.updateAdmin(org.id, org.member.profileid, true), 'promote');
		const promoted = await profiles();
		expect(Organization.getAdminCount(promoted)).toBe(before + 1);
		expect(Organization.hasAdminProfile(promoted, org.member.profileid)).toBe(true);

		expectOk(await org.admin.db.updateAdmin(org.id, org.member.profileid, false), 'demote');
		expect(Organization.getAdminCount(await profiles())).toBe(before);
	});

	it('getProfileWithEmail finds a profile by its stored email', async () => {
		const all = await profiles();
		expect(Organization.getProfileWithEmail(all, org.member.email)?.id).toBe(org.member.profileid);
		expect(Organization.getProfileWithEmail(all, ghostEmail)?.id).toBe(ghostProfileID);
		expect(Organization.getProfileWithEmail(all, 'nobody@example.com')).toBeNull();
	});

	it('getProfileWithPersonID finds a linked profile, and nothing for an unlinked person', async () => {
		const all = await profiles();
		expect(Organization.getProfileWithPersonID(all, org.member.id)?.id).toBe(org.member.profileid);
		// The trigger linked this one despite the email case mismatch.
		expect(Organization.getProfileWithPersonID(all, casedPerson.id)?.id).toBe(casedProfileID);
		expect(Organization.getProfileWithPersonID(all, org.outsider.id)).toBeNull();
	});

	it('getProfileWithID finds a profile by profile id', async () => {
		const all = await profiles();
		expect(Organization.getProfileWithID(all, org.admin.profileid)?.email).toBe(org.admin.email);
		expect(Organization.getProfileWithID(all, ghostProfileID)?.name).toBe('Ghost');
		expect(Organization.getProfileWithID(all, org.id)).toBeNull();
	});

	it('getPersonNameOrEmail prefers the name and falls back to the email', async () => {
		const all = await profiles();
		expect(Organization.getPersonNameOrEmail(all, casedPerson.id)).toBe('Cased');
		// blankPerson was added with no name, so the email stands in.
		expect((await profileRow(blankProfileID)).name).toBe('');
		expect(Organization.getPersonNameOrEmail(all, blankPerson.id)).toBe(blankPerson.email);
		expect(Organization.getPersonNameOrEmail(all, org.outsider.id)).toBeNull();
	});

	it('getProfileWithNameOrEmail prefers the name and falls back to the email', async () => {
		const all = await profiles();
		expect(Organization.getProfileWithNameOrEmail(all, ghostProfileID)).toBe('Ghost');
		expect(Organization.getProfileWithNameOrEmail(all, blankProfileID)).toBe(blankPerson.email);
		expect(Organization.getProfileWithNameOrEmail(all, org.id)).toBeNull();
	});

	it('getProfileRoles and getPersonRoles reflect real assignments', async () => {
		expectOk(
			await org.admin.db.assignPerson(org.id, org.member.profileid, role.id),
			'assignPerson'
		);
		const { data: roles, error } = await Organization.queryRoles(org.admin.client, org.id);
		expectNoError(error, 'queryRoles');

		const all = await profiles();
		const assigned = await assignments();

		expect(
			Organization.getProfileRoles(org.member.profileid, assigned, roles!).map((r) => r.id)
		).toEqual([role.id]);
		expect(Organization.getPersonRoles(all, assigned, org.member.id)).toEqual([role.id]);

		// Nobody else is assigned to anything.
		expect(Organization.getProfileRoles(org.admin.profileid, assigned, roles!)).toEqual([]);
		expect(Organization.getPersonRoles(all, assigned, org.admin.id)).toEqual([]);
		// An outsider has no profile at all, so no roles.
		expect(Organization.getPersonRoles(all, assigned, org.outsider.id)).toEqual([]);

		expectOk(
			await org.admin.db.unassignPerson(org.id, org.member.profileid, role.id),
			'unassignPerson'
		);
	});
});

describe('profile access control', () => {
	// Force the member back to non-admin before each test. If self-promotion ever regresses, one
	// leaked promotion would otherwise make the rest of this block pass for the wrong reason.
	beforeEach(async () => {
		await admin.from('profiles').update({ admin: false }).eq('id', org.member.profileid);
	});

	/**
	 * Regression: the profiles UPDATE policy is `auth.uid() = personid or isAdmin(orgid)`, which gates
	 * the row rather than the columns — a person needs it to edit their own name and bio, but it also
	 * let them set `admin = true` on themselves. The protect_profile_privileges trigger now blocks
	 * changes to `admin` and `supervisor` by anyone who isn't already an admin of the org.
	 */
	it('a non-admin member cannot promote themselves to admin', async () => {
		expect((await profileRow(org.member.profileid)).admin).toBe(false);

		await org.member.db.updateAdmin(org.id, org.member.profileid, true);
		expect((await profileRow(org.member.profileid)).admin).toBe(false);
	});

	it('a non-admin member cannot set their own supervisor', async () => {
		const before = (await profileRow(org.member.profileid)).supervisor;
		await org.member.db.updateProfileSupervisor(org.id, org.member.profileid, org.admin.profileid);
		expect((await profileRow(org.member.profileid)).supervisor).toBe(before);
	});

	it('an admin can still promote and demote a member', async () => {
		await org.admin.db.updateAdmin(org.id, org.member.profileid, true);
		expect((await profileRow(org.member.profileid)).admin).toBe(true);

		await org.admin.db.updateAdmin(org.id, org.member.profileid, false);
		expect((await profileRow(org.member.profileid)).admin).toBe(false);
	});

	it('a member can still edit their own name and bio', async () => {
		expectOk(
			await org.member.db.updateProfileName(await profileRow(org.member.profileid), 'Self Named'),
			'updateProfileName'
		);
		expect((await profileRow(org.member.profileid)).name).toBe('Self Named');
	});

	it('a non-admin member cannot change someone else s admin status', async () => {
		const before = await profileRow(casedProfileID);
		expect(before.admin).toBe(false);
		await org.member.db.updateAdmin(org.id, casedProfileID, true);
		expect((await profileRow(casedProfileID)).admin).toBe(false);
	});

	it('a non-admin member cannot remove another profile', async () => {
		const target = await throwawayProfile('removal-target');
		await org.member.db.removeProfile(target);
		expect(await readRow('profiles', target)).not.toBeNull();
	});

	it('a non-admin member cannot add a person by email', async () => {
		const email = `member-added-${Date.now()}@example.com`;
		const { error } = await org.member.db.addPersonByEmail(org.id, email, 'Sneaky');
		expect(error).not.toBeNull();

		const { data } = await admin
			.from('profiles')
			.select('id')
			.eq('orgid', org.id)
			.eq('email', email);
		expect(data).toEqual([]);
	});

	it('an outsider cannot add a person by email', async () => {
		const email = `outsider-added-${Date.now()}@example.com`;
		const { error } = await org.outsider.db.addPersonByEmail(org.id, email, 'Sneaky');
		expect(error).not.toBeNull();

		const { data } = await admin
			.from('profiles')
			.select('id')
			.eq('orgid', org.id)
			.eq('email', email);
		expect(data).toEqual([]);
	});

	it('an anonymous caller cannot insert a profile', async () => {
		const email = `anon-added-${Date.now()}@example.com`;
		const anonDb = new Organization(anonClient());
		const { error } = await anonDb.addPersonByEmail(org.id, email, 'Anon');
		expect(error).not.toBeNull();

		const { data } = await admin
			.from('profiles')
			.select('id')
			.eq('orgid', org.id)
			.eq('email', email);
		expect(data).toEqual([]);
	});

	it('an outsider cannot rename a profile', async () => {
		const before = await profileRow(org.member.profileid);
		await org.outsider.db.updateProfileName(before, 'Outsider Renamed');
		expect((await profileRow(org.member.profileid)).name).toBe(before.name);
	});

	it('a non-admin member cannot set a supervisor on someone else s profile', async () => {
		const target = await throwawayProfile('supervisor-target');
		expect((await profileRow(target)).supervisor).toBeNull();
		await org.member.db.updateProfileSupervisor(org.id, target, org.member.profileid);
		expect((await profileRow(target)).supervisor).toBeNull();
	});

	it('an anonymous caller cannot assign a person to a role', async () => {
		const anonDb = new Organization(anonClient());
		await anonDb.assignPerson(org.id, org.member.profileid, role.id);
		expect(await assignmentExists(org.member.profileid, role.id)).toBe(false);
	});
});
