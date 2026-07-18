import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Organization, { type TeamRow } from '../src/database/Organization';
import {
	admin,
	cleanup,
	createTestOrg,
	expectNoError,
	expectOk,
	readRow,
	type TestOrg
} from './harness';

let org: TestOrg;

/** Create a team as the org admin and return the row, failing loudly if the insert was refused. */
async function newTeam(name: string): Promise<TeamRow> {
	const { data, error } = await org.admin.db.createTeam(org.id, name);
	expectNoError(error, `createTeam(${name})`);
	return data!;
}

beforeAll(async () => {
	org = await createTestOrg('Team CRUD');
});

afterAll(cleanup);

describe('team CRUD', () => {
	it('createTeam inserts a team in the org and returns it', async () => {
		const team = await newTeam('Engineering');
		expect(team.name).toBe('Engineering');
		expect(team.orgid).toBe(org.id);

		const row = await readRow('teams', team.id);
		expect(row?.name).toBe('Engineering');
		expect(row?.description).toBe('');
		expect(row?.comments).toEqual([]);
	});

	it('updateTeamName renames the team and records a comment', async () => {
		const team = await newTeam('Old Name');
		expectOk(await org.admin.db.updateTeamName(team, 'New Name', org.admin.id), 'updateTeamName');
		expect((await readRow('teams', team.id))?.name).toBe('New Name');

		// The comment row itself is created (it is the linking step that is broken; see the next test).
		const { data: comments } = await admin
			.from('comments')
			.select('*')
			.eq('orgid', org.id)
			.eq('what', 'Updated team name to New Name');
		expect(comments!.length).toBe(1);
	});

	// Regression: updateTeamName used to pass 'orgs' as the comment's table, so the comment id was
	// written to `orgs` where id = the team's id — a row that never exists. PostgREST reports no error
	// on a zero-row update, so the rename silently vanished from the team's history.
	it('updateTeamName attaches the comment to the team it renamed', async () => {
		const team = await newTeam('Comment Target');
		expectOk(
			await org.admin.db.updateTeamName(team, 'Renamed Again', org.admin.id),
			'updateTeamName'
		);

		const row = await readRow('teams', team.id);
		expect(row?.comments.length).toBe(1);
	});

	it('updateTeamDescription sets the description and records a comment on the team', async () => {
		const team = await newTeam('Described');
		expectOk(
			await org.admin.db.updateTeamDescription(team, 'Builds the thing.', org.admin.id),
			'updateTeamDescription'
		);

		const row = await readRow('teams', team.id);
		expect(row?.description).toBe('Builds the thing.');
		expect(row?.comments.length).toBe(1);

		const { data: comment } = await admin
			.from('comments')
			.select('*')
			.eq('id', row!.comments[0])
			.single();
		expect(comment?.what).toBe('Updated team description');
		expect(comment?.who).toBe(org.admin.id);
	});

	it('deleteTeam removes the row and leaves its roles intact but teamless', async () => {
		const team = await newTeam('Doomed Team');
		const { data: role, error } = await org.admin.db.createRole(org.id, 'Orphaned Role');
		expectNoError(error, 'createRole');
		expectOk(
			await org.admin.db.updateRoleTeam(role!, team.id, team.name, org.admin.id),
			'updateRoleTeam'
		);
		expect((await readRow('roles', role!.id))?.team).toBe(team.id);

		expectOk(await org.admin.db.deleteTeam(team.id), 'deleteTeam');

		expect(await readRow('teams', team.id)).toBeNull();
		// roles.team is `on delete set null`, so the role survives with no team.
		const orphan = await readRow('roles', role!.id);
		expect(orphan).not.toBeNull();
		expect(orphan?.team).toBeNull();
		expect(orphan?.title).toBe('Orphaned Role');
	});
});

describe('team queries', () => {
	it('queryTeams returns every team in the org and none from other orgs', async () => {
		const mine = await newTeam('Mine');
		const other = await createTestOrg('Teams Elsewhere');
		const { data: theirs } = await other.admin.db.createTeam(other.id, 'Theirs');

		const { data, error } = await Organization.queryTeams(org.admin.client, org.id);
		expect(error).toBeNull();
		const ids = data!.map((t) => t.id);
		expect(ids).toContain(mine.id);
		expect(ids).not.toContain(theirs!.id);

		const { data: actual } = await admin.from('teams').select('id').eq('orgid', org.id);
		expect(ids.sort()).toEqual(actual!.map((t) => t.id).sort());
	});

	it('queryTeam returns the team, and errors for one in another org', async () => {
		const team = await newTeam('Queried');
		const { data, error } = await Organization.queryTeam(org.admin.client, org.id, team.id);
		expect(error).toBeNull();
		expect(data?.id).toBe(team.id);
		expect(data?.name).toBe('Queried');

		// .single() over an empty result is an error, not a null row.
		const other = await createTestOrg('Team Query Elsewhere');
		const { data: missing } = await Organization.queryTeam(other.admin.client, other.id, team.id);
		expect(missing).toBeNull();
	});

	it('queryTeamRoles returns only the roles on that team', async () => {
		const team = await newTeam('Staffed Team');
		const empty = await newTeam('Empty Team');
		const { data: onTeam } = await org.admin.db.createRole(org.id, 'On Team');
		const { data: offTeam } = await org.admin.db.createRole(org.id, 'Off Team');
		expectOk(
			await org.admin.db.updateRoleTeam(onTeam!, team.id, team.name, org.admin.id),
			'updateRoleTeam'
		);

		const { data, error } = await Organization.queryTeamRoles(org.admin.client, org.id, team.id);
		expect(error).toBeNull();
		expect(data!.map((r) => r.id)).toEqual([onTeam!.id]);
		expect(data!.map((r) => r.id)).not.toContain(offTeam!.id);

		const { data: none } = await Organization.queryTeamRoles(org.admin.client, org.id, empty.id);
		expect(none).toEqual([]);
	});
});

describe('team access control', () => {
	it('a non-admin member cannot create a team', async () => {
		const { data: before } = await admin.from('teams').select('id').eq('orgid', org.id);
		const { data, error } = await org.member.db.createTeam(org.id, 'Sneaky Team');
		expect(data).toBeNull();
		expect(error).not.toBeNull();

		const { data: after } = await admin.from('teams').select('id').eq('orgid', org.id);
		expect(after!.length).toBe(before!.length);
	});

	it('a non-admin member cannot delete a team', async () => {
		const team = await newTeam('Protected Team');
		await org.member.db.deleteTeam(team.id);
		// RLS filters the delete rather than erroring, so assert the row survived.
		expect(await readRow('teams', team.id)).not.toBeNull();
	});

	it('a non-admin member cannot rename a team', async () => {
		const team = await newTeam('Unrenamable Team');
		await org.member.db.updateTeamName(team, 'Member Renamed', org.member.id);
		expect((await readRow('teams', team.id))?.name).toBe('Unrenamable Team');
	});

	it('an outsider cannot create or read the org teams', async () => {
		const { error } = await org.outsider.db.createTeam(org.id, 'Outsider Team');
		expect(error).not.toBeNull();

		const { data } = await Organization.queryTeams(org.outsider.client, org.id);
		expect(data).toEqual([]);
	});
});
