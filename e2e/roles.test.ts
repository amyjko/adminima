import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Organization, { type RoleRow } from '../src/database/Organization';
import {
	admin,
	anonClient,
	cleanup,
	createTestOrg,
	expectNoError,
	expectOk,
	readRow,
	type TestOrg
} from './harness';

let org: TestOrg;

/** Create a role as the org admin and return the row, failing loudly if the insert was refused. */
async function newRole(title: string): Promise<RoleRow> {
	const { data, error } = await org.admin.db.createRole(org.id, title);
	expectNoError(error, `createRole(${title})`);
	return data!;
}

beforeAll(async () => {
	org = await createTestOrg('Role CRUD');
});

afterAll(cleanup);

describe('role CRUD', () => {
	it('createRole inserts a role in the org and returns it', async () => {
		const role = await newRole('Treasurer');
		expect(role.title).toBe('Treasurer');
		expect(role.orgid).toBe(org.id);

		const row = await readRow('roles', role.id);
		expect(row?.title).toBe('Treasurer');
		// Defaults the schema promises.
		expect(row?.description).toBe('');
		expect(row?.team).toBeNull();
		expect(row?.short).toEqual([]);
	});

	it('updateRoleTitle renames the role and records a comment', async () => {
		const role = await newRole('Old Title');
		expectOk(
			await org.admin.db.updateRoleTitle(role, 'New Title', org.admin.id),
			'updateRoleTitle'
		);

		const row = await readRow('roles', role.id);
		expect(row?.title).toBe('New Title');
		expect(row?.comments.length).toBe(role.comments.length + 1);

		const { data: comment } = await admin
			.from('comments')
			.select('*')
			.eq('id', row!.comments[row!.comments.length - 1])
			.single();
		expect(comment?.what).toBe('Updated role title to New Title');
		expect(comment?.who).toBe(org.admin.id);
	});

	it('updateRoleDescription sets the description and records a comment', async () => {
		const role = await newRole('Described');
		expectOk(
			await org.admin.db.updateRoleDescription(role, 'Keeps the books.', org.admin.id),
			'updateRoleDescription'
		);

		const row = await readRow('roles', role.id);
		expect(row?.description).toBe('Keeps the books.');
		expect(row?.comments.length).toBe(1);
	});

	it('updateRoleTeam assigns a team, and clears it when passed null', async () => {
		const role = await newRole('Teamed');
		const { data: team, error } = await org.admin.db.createTeam(org.id, 'Finance');
		expectNoError(error, 'createTeam');

		expectOk(
			await org.admin.db.updateRoleTeam(role, team!.id, team!.name, org.admin.id),
			'updateRoleTeam (set)'
		);
		expect((await readRow('roles', role.id))?.team).toBe(team!.id);

		// Pass the refreshed row so the comment list stays consistent.
		const withTeam = (await readRow('roles', role.id))!;
		expectOk(
			await org.admin.db.updateRoleTeam(withTeam, null, undefined, org.admin.id),
			'updateRoleTeam (clear)'
		);

		const cleared = await readRow('roles', role.id);
		expect(cleared?.team).toBeNull();
		expect(cleared?.comments.length).toBe(2);

		const { data: comments } = await admin.from('comments').select('*').in('id', cleared!.comments);
		const texts = comments?.map((c) => c.what) ?? [];
		expect(texts).toContain('Updated role team to Finance');
		expect(texts).toContain('Removed role from team');
	});

	it('updateRoleShortName prepends to the short name array without duplicating', async () => {
		const role = await newRole('Shortened');
		expectOk(await org.admin.db.updateRoleShortName(role, 'treasurer'), 'updateRoleShortName');
		expect((await readRow('roles', role.id))?.short).toEqual(['treasurer']);

		// Adding a second name keeps the old one, newest first — old permalinks must keep resolving.
		const first = (await readRow('roles', role.id))!;
		expectOk(await org.admin.db.updateRoleShortName(first, 'money'), 'updateRoleShortName 2');
		expect((await readRow('roles', role.id))?.short).toEqual(['money', 'treasurer']);

		// Re-adding an existing name is a no-op rather than a duplicate.
		const second = (await readRow('roles', role.id))!;
		expectOk(await org.admin.db.updateRoleShortName(second, 'treasurer'), 'updateRoleShortName 3');
		expect((await readRow('roles', role.id))?.short).toEqual(['treasurer', 'money']);
	});

	it('deleteRole removes the row, its assignments, and its references from hows', async () => {
		const role = await newRole('Doomed');

		// Give the role an assignment, a how it is responsible for, and a process it is accountable for.
		expectOk(
			await org.admin.db.assignPerson(org.id, org.member.profileid, role.id),
			'assignPerson'
		);

		const { error: processError, data: processid } = await org.admin.db.addProcess(
			org.id,
			'Budgeting',
			'org'
		);
		expectNoError(processError, 'addProcess');
		const { data: hows } = await Organization.queryProcessHows(admin, processid!);
		const how = hows![0];
		expectOk(await org.admin.db.addHowRCI(how, role.id, 'responsible'), 'addHowRCI responsible');
		const process = (await readRow('processes', processid!))!;
		expectOk(
			await org.admin.db.updateProcessAccountable(process, role.id),
			'updateProcessAccountable'
		);

		expectOk(await org.admin.db.deleteRole(org.id, role.id), 'deleteRole');

		// The row is gone.
		expect(await readRow('roles', role.id)).toBeNull();

		// deleteRole scrubs the role out of hows itself.
		expect((await readRow('hows', how.id))?.responsible).not.toContain(role.id);

		// The schema cascades assignments and nulls the accountable reference.
		const { data: assignments } = await admin.from('assignments').select('*').eq('roleid', role.id);
		expect(assignments).toEqual([]);
		expect((await readRow('processes', processid!))?.accountable).toBeNull();
	});
});

describe('role queries', () => {
	it('queryRole returns the role, and null for one in another org', async () => {
		const role = await newRole('Queried');
		const found = await Organization.queryRole(org.admin.client, org.id, role.id);
		expect(found?.id).toBe(role.id);
		expect(found?.title).toBe('Queried');

		const other = await createTestOrg('Other Org');
		expect(await Organization.queryRole(other.admin.client, other.id, role.id)).toBeNull();
	});

	it('queryRoleByShortName finds a role by any of its short names', async () => {
		const role = await newRole('Shorty');
		expectOk(await org.admin.db.updateRoleShortName(role, 'shorty'), 'updateRoleShortName');
		const refreshed = (await readRow('roles', role.id))!;
		expectOk(await org.admin.db.updateRoleShortName(refreshed, 'shrt'), 'updateRoleShortName');

		// Both the newest and the retired short name resolve to the same role.
		expect((await Organization.queryRoleByShortName(org.admin.client, org.id, 'shrt'))?.id).toBe(
			role.id
		);
		expect((await Organization.queryRoleByShortName(org.admin.client, org.id, 'shorty'))?.id).toBe(
			role.id
		);

		expect(await Organization.queryRoleByShortName(org.admin.client, org.id, 'nope')).toBeNull();
	});

	it('queryRoles returns every role in the org and none from other orgs', async () => {
		const mine = await newRole('Mine');
		const other = await createTestOrg('Roles Elsewhere');
		const { data: theirs } = await other.admin.db.createRole(other.id, 'Theirs');

		const { data, error } = await Organization.queryRoles(org.admin.client, org.id);
		expect(error).toBeNull();
		const ids = data!.map((r) => r.id);
		expect(ids).toContain(mine.id);
		expect(ids).not.toContain(theirs!.id);

		// It matches what the service role sees for the org.
		const { data: actual } = await admin.from('roles').select('id').eq('orgid', org.id);
		expect(ids.sort()).toEqual(actual!.map((r) => r.id).sort());
	});
});

describe('role static helpers over real rows', () => {
	it('getRoleByID finds a role in a queried list, and returns null when absent', async () => {
		const role = await newRole('Findable');
		const { data: roles } = await Organization.queryRoles(org.admin.client, org.id);
		expect(Organization.getRoleByID(roles!, role.id)?.title).toBe('Findable');
		expect(Organization.getRoleByID(roles!, org.id)).toBeNull();
	});

	it('getRoleProfiles returns the profiles assigned to a role', async () => {
		const role = await newRole('Staffed');
		const empty = await newRole('Unstaffed');
		expectOk(
			await org.admin.db.assignPerson(org.id, org.admin.profileid, role.id),
			'assignPerson admin'
		);
		expectOk(
			await org.admin.db.assignPerson(org.id, org.member.profileid, role.id),
			'assignPerson member'
		);

		const { data: assignments } = await Organization.queryAssignments(org.admin.client, org.id);
		const { data: profiles } = await Organization.queryProfiles(org.admin.client, org.id);

		const staffed = Organization.getRoleProfiles(role.id, assignments!, profiles!);
		expect(staffed.map((p) => p.id).sort()).toEqual(
			[org.admin.profileid, org.member.profileid].sort()
		);
		expect(Organization.getRoleProfiles(empty.id, assignments!, profiles!)).toEqual([]);
	});

	it('getRoleProcesses returns processes reached via RCI hows and via accountability', async () => {
		const responsible = await newRole('Responsible Role');
		const consulted = await newRole('Consulted Role');
		const informed = await newRole('Informed Role');
		const accountable = await newRole('Accountable Role');
		const idle = await newRole('Idle Role');

		// One process per way a role can be attached, so we can tell the paths apart.
		const made: Record<string, string> = {};
		for (const [key, title] of [
			['responsible', 'R Process'],
			['consulted', 'C Process'],
			['informed', 'I Process'],
			['accountable', 'A Process']
		]) {
			const { error, data: id } = await org.admin.db.addProcess(org.id, title, 'org');
			expectNoError(error, `addProcess ${title}`);
			made[key] = id!;
		}

		for (const [key, role] of [
			['responsible', responsible],
			['consulted', consulted],
			['informed', informed]
		] as const) {
			const { data: hows } = await Organization.queryProcessHows(admin, made[key]);
			expectOk(await org.admin.db.addHowRCI(hows![0], role.id, key), `addHowRCI ${key}`);
		}

		const accountableProcess = (await readRow('processes', made.accountable))!;
		expectOk(
			await org.admin.db.updateProcessAccountable(accountableProcess, accountable.id),
			'updateProcessAccountable'
		);

		const { data: hows } = await Organization.queryHows(org.admin.client, org.id);
		const { data: processes } = await Organization.queryProcesses(org.admin.client, org.id);

		expect(
			Organization.getRoleProcesses(responsible.id, hows!, processes!).map((p) => p.id)
		).toEqual([made.responsible]);
		expect(Organization.getRoleProcesses(consulted.id, hows!, processes!).map((p) => p.id)).toEqual(
			[made.consulted]
		);
		expect(Organization.getRoleProcesses(informed.id, hows!, processes!).map((p) => p.id)).toEqual([
			made.informed
		]);
		expect(
			Organization.getRoleProcesses(accountable.id, hows!, processes!).map((p) => p.id)
		).toEqual([made.accountable]);
		expect(Organization.getRoleProcesses(idle.id, hows!, processes!)).toEqual([]);
	});

	it('getRoleProcesses does not repeat a process a role is both responsible and accountable for', async () => {
		const role = await newRole('Double Duty');
		const { error, data: id } = await org.admin.db.addProcess(org.id, 'Doubled Process', 'org');
		expectNoError(error, 'addProcess');

		const { data: processHows } = await Organization.queryProcessHows(admin, id!);
		expectOk(await org.admin.db.addHowRCI(processHows![0], role.id, 'responsible'), 'addHowRCI');
		expectOk(
			await org.admin.db.updateProcessAccountable((await readRow('processes', id!))!, role.id),
			'updateProcessAccountable'
		);

		const { data: hows } = await Organization.queryHows(org.admin.client, org.id);
		const { data: processes } = await Organization.queryProcesses(org.admin.client, org.id);
		expect(Organization.getRoleProcesses(role.id, hows!, processes!).map((p) => p.id)).toEqual([
			id
		]);
	});

	it('getTeamRoles returns only the roles on the given team', async () => {
		const { data: team, error } = await org.admin.db.createTeam(org.id, 'Ops');
		expectNoError(error, 'createTeam');
		const onTeam = await newRole('On Ops');
		const offTeam = await newRole('Off Ops');
		expectOk(
			await org.admin.db.updateRoleTeam(onTeam, team!.id, team!.name, org.admin.id),
			'updateRoleTeam'
		);

		const { data: roles } = await Organization.queryRoles(org.admin.client, org.id);
		const teamRoles = Organization.getTeamRoles(roles!, team!.id);
		expect(teamRoles.map((r) => r.id)).toEqual([onTeam.id]);
		expect(teamRoles.map((r) => r.id)).not.toContain(offTeam.id);
	});
});

describe('role access control', () => {
	it('a non-admin member cannot create a role', async () => {
		const { data: before } = await admin.from('roles').select('id').eq('orgid', org.id);
		const { data, error } = await org.member.db.createRole(org.id, 'Sneaky Role');
		expect(data).toBeNull();
		expect(error).not.toBeNull();

		const { data: after } = await admin.from('roles').select('id').eq('orgid', org.id);
		expect(after!.length).toBe(before!.length);
	});

	it('a non-admin member cannot delete a role', async () => {
		const role = await newRole('Protected');
		await org.member.db.deleteRole(org.id, role.id);
		// RLS filters the delete rather than erroring, so assert the row survived.
		expect(await readRow('roles', role.id)).not.toBeNull();
	});

	it('a non-admin member cannot rename a role', async () => {
		const role = await newRole('Unrenamable');
		await org.member.db.updateRoleTitle(role, 'Member Renamed', org.member.id);
		expect((await readRow('roles', role.id))?.title).toBe('Unrenamable');
	});

	it('an outsider cannot create a role', async () => {
		const { data: before } = await admin.from('roles').select('id').eq('orgid', org.id);
		const { data, error } = await org.outsider.db.createRole(org.id, 'Outsider Role');
		expect(data).toBeNull();
		expect(error).not.toBeNull();

		const { data: after } = await admin.from('roles').select('id').eq('orgid', org.id);
		expect(after!.length).toBe(before!.length);
	});

	// Regression: the roles SELECT policy used to be `using (true)`, so every role title in every
	// organization was readable by anyone, including signed-out visitors, no matter how the org's
	// visibility was set. It now gates on visibility the same way teams do.
	it('an outsider cannot read the roles of an org that is not public', async () => {
		const role = await newRole('Privately Visible');
		const { data } = await Organization.queryRoles(org.outsider.client, org.id);
		expect(data!.map((r) => r.id)).not.toContain(role.id);
	});

	it('an anonymous visitor cannot read the roles of an org that is not public', async () => {
		const role = await newRole('Anon Cannot See');
		const { data } = await Organization.queryRoles(anonClient(), org.id);
		expect(data!.map((r) => r.id)).not.toContain(role.id);
	});

	it('an outsider and an anonymous visitor can read the roles of a public org', async () => {
		const publicOrg = await createTestOrg('Public Roles Org');
		const { data: row } = await admin.from('orgs').select('*').eq('id', publicOrg.id).single();
		expectOk(
			await publicOrg.admin.db.updateOrgVisibility(row!, 'public', publicOrg.admin.id),
			'updateOrgVisibility'
		);

		const { data: role, error } = await publicOrg.admin.db.createRole(publicOrg.id, 'Open Book');
		expectNoError(error, 'createRole');

		const { data: seenByOutsider } = await Organization.queryRoles(
			publicOrg.outsider.client,
			publicOrg.id
		);
		expect(seenByOutsider!.map((r) => r.id)).toContain(role!.id);

		const { data: seenByAnon } = await Organization.queryRoles(anonClient(), publicOrg.id);
		expect(seenByAnon!.map((r) => r.id)).toContain(role!.id);
	});
});
