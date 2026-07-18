import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Organization from '../src/database/Organization';
import type { ChangeRow } from '../src/database/Organization';
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

beforeAll(async () => {
	org = await createTestOrg('Change CRUD');
});

afterAll(cleanup);

/** Create a change as the given person and return the freshly inserted row. */
async function makeChange(
	person: TestOrg['admin'],
	what = 'A change',
	visibility: 'public' | 'org' | 'admin' = 'org'
): Promise<ChangeRow> {
	const { data, error } = await person.db.createChange(
		person.id,
		org.id,
		what,
		'A description',
		visibility,
		[],
		[]
	);
	expectNoError(error, 'createChange');
	return data!;
}

/** Re-read a change with the service role, so RLS can't hide what actually landed. */
async function reread(change: ChangeRow): Promise<ChangeRow> {
	const row = await readRow('suggestions', change.id);
	expect(row).not.toBeNull();
	return row as ChangeRow;
}

describe('change creation and deletion', () => {
	it('createChange inserts a row with the given fields', async () => {
		const change = await makeChange(org.admin, 'Fix the coffee machine', 'org');

		expect(change.what).toBe('Fix the coffee machine');
		expect(change.orgid).toBe(org.id);
		expect(change.who).toBe(org.admin.id);
		expect(change.comments).toEqual([]);

		const row = await reread(change);
		expect(row.what).toBe('Fix the coffee machine');
		expect(row.description).toBe('A description');
		expect(row.visibility).toBe('org');
		expect(row.status).toBe('triage');
		expect(row.roles).toEqual([]);
		expect(row.processes).toEqual([]);
	});

	it('createChange stores the roles and processes it is given', async () => {
		const { data: role } = await org.admin.db.createRole(org.id, 'Barista');
		const { data: processid } = await org.admin.db.addProcess(org.id, 'Brew coffee', 'org');

		const { data: change, error } = await org.admin.db.createChange(
			org.admin.id,
			org.id,
			'Change with links',
			'',
			'org',
			[processid!],
			[role!.id]
		);
		expectNoError(error, 'createChange with links');

		const row = await reread(change!);
		expect(row.roles).toEqual([role!.id]);
		expect(row.processes).toEqual([processid]);
	});

	it('deleteChange removes the row', async () => {
		const change = await makeChange(org.admin, 'Doomed change');
		expect(await readRow('suggestions', change.id)).not.toBeNull();

		const { error } = await org.admin.db.deleteChange(change.id);
		expectNoError(error, 'deleteChange');

		expect(await readRow('suggestions', change.id)).toBeNull();
	});
});

describe('change field updates', () => {
	let change: ChangeRow;

	beforeAll(async () => {
		change = await makeChange(org.admin, 'Mutable change');
	});

	it('updateChangeVisibility changes visibility', async () => {
		expectOk(await org.admin.db.updateChangeVisibility(change, 'public'), 'updateChangeVisibility');
		expect((await reread(change)).visibility).toBe('public');

		expectOk(await org.admin.db.updateChangeVisibility(change, 'org'), 'back to org');
		expect((await reread(change)).visibility).toBe('org');
	});

	it('updateChangeLead sets and clears the lead profile', async () => {
		expectOk(await org.admin.db.updateChangeLead(change, org.member.profileid), 'updateChangeLead');
		expect((await reread(change)).lead).toBe(org.member.profileid);

		expectOk(await org.admin.db.updateChangeLead(change, null), 'clear lead');
		expect((await reread(change)).lead).toBeNull();
	});

	it('updateChangeReview sets and clears the review date', async () => {
		const when = '2030-01-01T00:00:00.000Z';
		expectOk(await org.admin.db.updateChangeReview(change, when), 'updateChangeReview');
		const row = await reread(change);
		expect(row.review).not.toBeNull();
		expect(new Date(row.review!).toISOString()).toBe(when);

		expectOk(await org.admin.db.updateChangeReview(change, null), 'clear review');
		expect((await reread(change)).review).toBeNull();
	});

	it('udpateChangeWhat updates the title', async () => {
		expectOk(await org.admin.db.udpateChangeWhat(change, 'Renamed change'), 'udpateChangeWhat');
		expect((await reread(change)).what).toBe('Renamed change');
	});

	it('udpateChangeWhat is a no-op when the title is unchanged', async () => {
		const current = await reread(change);
		expect((await org.admin.db.udpateChangeWhat(current, current.what)).error).toBeNull();
		expect((await reread(change)).what).toBe(current.what);
	});

	it('updateChangeDescription updates the description', async () => {
		const current = await reread(change);
		expectOk(
			await org.admin.db.updateChangeDescription(current, 'A better description'),
			'updateChangeDescription'
		);
		expect((await reread(change)).description).toBe('A better description');
	});

	it('updateChangeProposal updates the proposal', async () => {
		const current = await reread(change);
		expectOk(
			await org.admin.db.updateChangeProposal(current, 'Here is the proposal'),
			'updateChangeProposal'
		);
		expect((await reread(change)).proposal).toBe('Here is the proposal');
	});

	it('updateChangeRoles stores the given role ids', async () => {
		const { data: one } = await org.admin.db.createRole(org.id, 'Role One');
		const { data: two } = await org.admin.db.createRole(org.id, 'Role Two');

		const current = await reread(change);
		expectOk(
			await org.admin.db.updateChangeRoles(current, [one!.id, two!.id]),
			'updateChangeRoles'
		);
		expect((await reread(change)).roles).toEqual([one!.id, two!.id]);

		expectOk(await org.admin.db.updateChangeRoles(current, []), 'clear roles');
		expect((await reread(change)).roles).toEqual([]);
	});

	it('updateChangeProcesses stores the given process ids', async () => {
		const { data: one, error: oneError } = await org.admin.db.addProcess(
			org.id,
			'Process One',
			'org'
		);
		expectNoError(oneError, 'addProcess one');
		const { data: two, error: twoError } = await org.admin.db.addProcess(
			org.id,
			'Process Two',
			'org'
		);
		expectNoError(twoError, 'addProcess two');

		const current = await reread(change);
		expectOk(
			await org.admin.db.updateChangeProcesses(current, [one!, two!]),
			'updateChangeProcesses'
		);
		expect((await reread(change)).processes).toEqual([one, two]);
	});

	it('updateChangeStatus updates the status and appends a status comment', async () => {
		const current = await reread(change);
		expect(current.status).toBe('triage');

		expectOk(
			await org.admin.db.updateChangeStatus(current, 'active', org.admin.id),
			'updateChangeStatus'
		);

		const updated = await reread(change);
		expect(updated.status).toBe('active');
		expect(updated.comments.length).toBe(current.comments.length + 1);

		const newest = updated.comments[updated.comments.length - 1];
		const comment = await readRow('comments', newest);
		expect(comment?.what).toBe('Updated status to active');
		expect(comment?.who).toBe(org.admin.id);
	});

	it('updateChangeStatus is a no-op when the status is unchanged', async () => {
		const current = await reread(change);
		expect(
			(await org.admin.db.updateChangeStatus(current, current.status, org.admin.id)).error
		).toBeNull();
		expect((await reread(change)).comments.length).toBe(current.comments.length);
	});

	// updateChangeStatus finishes by delegating to addComment, whose result it returns. Because the
	// method is itself async the returned promise is flattened, so callers still receive a settled
	// MutationResult. This pins that down so a future refactor can't quietly start returning an
	// unresolved promise in place of the error.
	it('updateChangeStatus returns an error value, not a Promise', async () => {
		const other = await makeChange(org.admin, 'Status return value');
		const result = await org.admin.db.updateChangeStatus(other, 'backlog', org.admin.id);
		expect(
			result.error === null || typeof (result.error as { message?: string }).message === 'string'
		).toBe(true);
	});
});

describe('change queries', () => {
	it('queryChange returns a single change by id', async () => {
		const change = await makeChange(org.admin, 'Queryable change');
		const { data, error } = await Organization.queryChange(org.admin.client, change.id);
		expect(error).toBeNull();
		expect(data?.id).toBe(change.id);
		expect(data?.what).toBe('Queryable change');
	});

	it('queryChanges returns every visible change in the org', async () => {
		const change = await makeChange(org.admin, 'In the list');
		const { data, error } = await Organization.queryChanges(org.admin.client, org.id);
		expect(error).toBeNull();
		expect(data?.map((c) => c.id)).toContain(change.id);
		expect(data?.every((c) => c.orgid === org.id)).toBe(true);
	});

	it('queryChanges does not return changes from an org the caller is not in', async () => {
		await makeChange(org.admin, 'Private to the org', 'org');
		const { data } = await Organization.queryChanges(org.outsider.client, org.id);
		expect(data ?? []).toEqual([]);
	});

	it('queryLeadChanges returns only changes led by the given profile', async () => {
		const led = await makeChange(org.admin, 'Led change');
		const unled = await makeChange(org.admin, 'Unled change');
		expectOk(await org.admin.db.updateChangeLead(led, org.member.profileid), 'set lead');

		const { data, error } = await Organization.queryLeadChanges(
			org.admin.client,
			org.id,
			org.member.profileid
		);
		expect(error).toBeNull();
		const ids = data?.map((c) => c.id) ?? [];
		expect(ids).toContain(led.id);
		expect(ids).not.toContain(unled.id);
		expect(data?.every((c) => c.lead === org.member.profileid)).toBe(true);
	});

	it('queryProcessChanges returns only changes that reference the process', async () => {
		const { data: processid, error } = await org.admin.db.addProcess(org.id, 'Queried', 'org');
		expectNoError(error, 'addProcess');

		const linked = await makeChange(org.admin, 'Linked to process');
		const unlinked = await makeChange(org.admin, 'Not linked');
		expectOk(
			await org.admin.db.updateChangeProcesses(linked, [processid!]),
			'updateChangeProcesses'
		);

		const { data, error: queryError } = await Organization.queryProcessChanges(
			org.admin.client,
			processid!
		);
		expect(queryError).toBeNull();
		const ids = data?.map((c) => c.id) ?? [];
		expect(ids).toContain(linked.id);
		expect(ids).not.toContain(unlinked.id);
	});
});

describe('change access control', () => {
	it('the author can update their own change', async () => {
		const change = await makeChange(org.member, 'Member authored');
		expectOk(await org.member.db.udpateChangeWhat(change, 'Member edited'), 'author update');
		expect((await reread(change)).what).toBe('Member edited');
	});

	it('an admin can update a change they did not author', async () => {
		const change = await makeChange(org.member, 'Member authored 2');
		expectOk(await org.admin.db.udpateChangeWhat(change, 'Admin edited'), 'admin update');
		expect((await reread(change)).what).toBe('Admin edited');
	});

	it('the lead can update a change they did not author', async () => {
		const change = await makeChange(org.admin, 'Lead editable');
		expectOk(await org.admin.db.updateChangeLead(change, org.member.profileid), 'set lead');

		const current = await reread(change);
		expectOk(await org.member.db.udpateChangeWhat(current, 'Lead edited'), 'lead update');
		expect((await reread(change)).what).toBe('Lead edited');
	});

	it('an unrelated member cannot update someone else’s change', async () => {
		const change = await makeChange(org.admin, 'Admin only edit');
		await org.member.db.udpateChangeWhat(change, 'Member sneaks in');
		expect((await reread(change)).what).toBe('Admin only edit');
	});

	it('an unrelated member cannot delete someone else’s change', async () => {
		const change = await makeChange(org.admin, 'Admin only delete');
		await org.member.db.deleteChange(change.id);
		expect(await readRow('suggestions', change.id)).not.toBeNull();
	});

	it('the author can delete their own change', async () => {
		const change = await makeChange(org.member, 'Member deletes own');
		expectNoError((await org.member.db.deleteChange(change.id)).error, 'author delete');
		expect(await readRow('suggestions', change.id)).toBeNull();
	});

	it('an admin can delete a change they did not author', async () => {
		const change = await makeChange(org.member, 'Admin deletes other');
		expectNoError((await org.admin.db.deleteChange(change.id)).error, 'admin delete');
		expect(await readRow('suggestions', change.id)).toBeNull();
	});

	it('an outsider cannot delete a change', async () => {
		const change = await makeChange(org.admin, 'Outsider cannot delete');
		await org.outsider.db.deleteChange(change.id);
		expect(await readRow('suggestions', change.id)).not.toBeNull();
	});

	it('an outsider cannot read an org-visible change', async () => {
		const change = await makeChange(org.admin, 'Org visible', 'org');
		const { data } = await Organization.queryChange(org.outsider.client, change.id);
		expect(data).toBeNull();

		// But the row really is there.
		expect(await readRow('suggestions', change.id)).not.toBeNull();
	});

	it('anyone can read a public change', async () => {
		const change = await makeChange(org.admin, 'Public change', 'public');
		const { data } = await Organization.queryChange(org.outsider.client, change.id);
		expect(data?.id).toBe(change.id);
	});
});

describe('change data integrity', () => {
	it('deleting a change removes it from the org’s query results', async () => {
		const change = await makeChange(org.admin, 'Gone from list');
		expectNoError((await org.admin.db.deleteChange(change.id)).error, 'deleteChange');
		const { data } = await Organization.queryChanges(org.admin.client, org.id);
		expect(data?.map((c) => c.id)).not.toContain(change.id);
	});

	it('deleting the org cascades to its changes', async () => {
		const other = await createTestOrg('Cascade Org');
		const { data: change } = await other.admin.db.createChange(
			other.admin.id,
			other.id,
			'Cascading',
			'',
			'org',
			[],
			[]
		);
		expect(await readRow('suggestions', change!.id)).not.toBeNull();

		await admin.from('orgs').delete().eq('id', other.id);
		expect(await readRow('suggestions', change!.id)).toBeNull();
	});
});
