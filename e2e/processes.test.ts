import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Organization, { type ProcessRow, type HowRow } from '../src/database/Organization';
import type Period from '../src/database/Period';
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
	org = await createTestOrg('Process CRUD');
});

afterAll(cleanup);

/** Create a process as the org admin and return the row the database actually stored. */
async function newProcess(
	title: string,
	visibility: 'public' | 'org' = 'org'
): Promise<ProcessRow> {
	const { error, data: id } = await org.admin.db.addProcess(org.id, title, visibility);
	expectNoError(error, `addProcess ${title}`);
	if (id === null) throw new Error(`addProcess ${title} returned no id`);
	const row = await readRow('processes', id);
	if (row === null) throw new Error(`process ${id} not found after addProcess`);
	return row;
}

/** Re-read a process through the service role, so assertions see what really landed. */
async function reread(process: ProcessRow): Promise<ProcessRow> {
	const row = await readRow('processes', process.id);
	if (row === null) throw new Error(`process ${process.id} missing`);
	return row;
}

describe('process creation', () => {
	it('addProcess creates the process and an empty root how linked by howid', async () => {
		const process = await newProcess('Onboarding');

		expect(process.title).toBe('Onboarding');
		expect(process.orgid).toBe(org.id);
		expect(process.repeat).toEqual([]);
		expect(process.howid).not.toBeNull();

		const root = (await readRow('hows', process.howid!)) as HowRow | null;
		expect(root).not.toBeNull();
		expect(root!.processid).toBe(process.id);
		expect(root!.orgid).toBe(org.id);
		expect(root!.what).toBe('');
		expect(root!.visibility).toBe('org');
		expect(root!.how).toEqual([]);
	});

	it('addProcess honors the visibility passed for the root how', async () => {
		const process = await newProcess('Public Process', 'public');
		const root = await readRow('hows', process.howid!);
		expect(root?.visibility).toBe('public');
	});
});

describe('process field updates', () => {
	it('updateProcessTitle updates the title and records a comment', async () => {
		const process = await newProcess('Old Title');
		expectOk(
			await org.admin.db.updateProcessTitle(process, 'New Title', org.admin.id),
			'updateProcessTitle'
		);

		const after = await reread(process);
		expect(after.title).toBe('New Title');
		expect(after.comments.length).toBe(process.comments.length + 1);

		const { data: comment } = await admin
			.from('comments')
			.select('*')
			.eq('id', after.comments[after.comments.length - 1])
			.single();
		expect(comment?.what).toBe('Updated process title to New Title');
		expect(comment?.who).toBe(org.admin.id);
	});

	it('updateProcessShortName prepends the short name', async () => {
		const process = await newProcess('Shorty');
		const short = `short-${Date.now()}`;
		expectOk(await org.admin.db.updateProcessShortName(process, short), 'updateProcessShortName');
		expect((await reread(process)).short).toEqual([short]);
	});

	it('updateProcessShortName keeps prior names and does not duplicate', async () => {
		const process = await newProcess('Shorty Two');
		const first = `first-${Date.now()}`;
		const second = `second-${Date.now()}`;

		expectOk(await org.admin.db.updateProcessShortName(process, first), 'first short');
		const afterFirst = await reread(process);
		expectOk(await org.admin.db.updateProcessShortName(afterFirst, second), 'second short');
		const afterSecond = await reread(process);
		expect(afterSecond.short).toEqual([second, first]);

		// Re-adding an existing name should leave the set unchanged in content.
		expectOk(await org.admin.db.updateProcessShortName(afterSecond, first), 'repeat short');
		const afterRepeat = await reread(process);
		expect(afterRepeat.short.length).toBe(2);
		expect(new Set(afterRepeat.short)).toEqual(new Set([first, second]));
	});

	it('updateProcessState updates state and records a comment', async () => {
		const process = await newProcess('Stateful');
		expect(process.state).toBe('draft');

		expectOk(
			await org.admin.db.updateProcessState(process, 'active', org.admin.id),
			'updateProcessState active'
		);
		const active = await reread(process);
		expect(active.state).toBe('active');

		expectOk(
			await org.admin.db.updateProcessState(active, 'archived', org.admin.id),
			'updateProcessState archived'
		);
		const archived = await reread(process);
		expect(archived.state).toBe('archived');
		expect(archived.comments.length).toBe(2);

		const { data: comments } = await admin.from('comments').select('*').in('id', archived.comments);
		expect(comments?.map((c) => c.what).sort()).toEqual([
			'Updated state to active',
			'Updated state to archived'
		]);
	});

	it('updateProcessConcern sets the concern and records a comment', async () => {
		const process = await newProcess('Concerned');
		expect(process.concern).toBe('');

		expectOk(
			await org.admin.db.updateProcessConcern(process, 'Hiring', org.admin.id),
			'updateProcessConcern'
		);
		const after = await reread(process);
		expect(after.concern).toBe('Hiring');
		expect(after.comments.length).toBe(1);

		const { data: comment } = await admin
			.from('comments')
			.select('*')
			.eq('id', after.comments[0])
			.single();
		expect(comment?.what).toBe('Updated concern to Hiring');
	});

	it('updateProcessAccountable sets and clears the accountable role', async () => {
		const process = await newProcess('Accountable');
		const { data: role, error: roleError } = await org.admin.db.createRole(org.id, 'Recruiter');
		expectNoError(roleError, 'createRole');
		expect(role).not.toBeNull();

		expectOk(
			await org.admin.db.updateProcessAccountable(process, role!.id),
			'updateProcessAccountable set'
		);
		expect((await reread(process)).accountable).toBe(role!.id);

		expectOk(
			await org.admin.db.updateProcessAccountable(await reread(process), null),
			'updateProcessAccountable clear'
		);
		expect((await reread(process)).accountable).toBeNull();
	});
});

describe('process periods', () => {
	const weekly: Period = { type: 'weekly', weeks: 2, day: 1 };
	const monthly: Period = { type: 'monthly-date', day: 15 };
	const annual: Period = { type: 'annually-date', month: 3, date: 1 };

	it('addProcessPeriod appends periods in order', async () => {
		const process = await newProcess('Repeating');
		expect(process.repeat).toEqual([]);

		expectOk(await org.admin.db.addProcessPeriod(process, weekly), 'addProcessPeriod weekly');
		const one = await reread(process);
		expect(one.repeat).toEqual([weekly]);

		expectOk(await org.admin.db.addProcessPeriod(one, monthly), 'addProcessPeriod monthly');
		const two = await reread(process);
		expect(two.repeat).toEqual([weekly, monthly]);
	});

	it('updateProcessPeriod replaces the period at an index, leaving others alone', async () => {
		const process = await newProcess('Reschedule');
		expectOk(await org.admin.db.addProcessPeriod(process, weekly), 'add weekly');
		expectOk(await org.admin.db.addProcessPeriod(await reread(process), monthly), 'add monthly');

		const before = await reread(process);
		expectOk(await org.admin.db.updateProcessPeriod(before, annual, 0), 'updateProcessPeriod');
		expect((await reread(process)).repeat).toEqual([annual, monthly]);
	});

	it('updateProcessPeriod is a no-op for an out of range index', async () => {
		const process = await newProcess('Out Of Range');
		expectOk(await org.admin.db.addProcessPeriod(process, weekly), 'add weekly');

		const before = await reread(process);
		expect((await org.admin.db.updateProcessPeriod(before, annual, 5)).error).toBeNull();
		expect((await reread(process)).repeat).toEqual([weekly]);
	});

	it('removeProcessPeriod removes only the period at the index', async () => {
		const process = await newProcess('Removal');
		expectOk(await org.admin.db.addProcessPeriod(process, weekly), 'add weekly');
		expectOk(await org.admin.db.addProcessPeriod(await reread(process), monthly), 'add monthly');
		expectOk(await org.admin.db.addProcessPeriod(await reread(process), annual), 'add annual');
		expect((await reread(process)).repeat).toEqual([weekly, monthly, annual]);

		expectOk(
			await org.admin.db.removeProcessPeriod(await reread(process), 1),
			'removeProcessPeriod'
		);
		expect((await reread(process)).repeat).toEqual([weekly, annual]);
	});

	it('removeProcessPeriod is a no-op for a negative or out of range index', async () => {
		const process = await newProcess('Bad Removal');
		expectOk(await org.admin.db.addProcessPeriod(process, weekly), 'add weekly');

		const before = await reread(process);
		expect((await org.admin.db.removeProcessPeriod(before, -1)).error).toBeNull();
		expect((await org.admin.db.removeProcessPeriod(before, 3)).error).toBeNull();
		expect((await reread(process)).repeat).toEqual([weekly]);
	});
});

describe('concerns', () => {
	it('renameConcern renames every process with the old concern and no others', async () => {
		const a = await newProcess('Concern A');
		const b = await newProcess('Concern B');
		const c = await newProcess('Concern C');

		expectOk(await org.admin.db.updateProcessConcern(a, 'Payroll', org.admin.id), 'concern a');
		expectOk(await org.admin.db.updateProcessConcern(b, 'Payroll', org.admin.id), 'concern b');
		expectOk(await org.admin.db.updateProcessConcern(c, 'Travel', org.admin.id), 'concern c');

		expectOk(await org.admin.db.renameConcern(org.id, 'Payroll', 'Compensation'), 'rename');

		expect((await reread(a)).concern).toBe('Compensation');
		expect((await reread(b)).concern).toBe('Compensation');
		expect((await reread(c)).concern).toBe('Travel');
	});

	it('queryConcerns returns the distinct non-empty concerns of the org', async () => {
		const concerns = await Organization.queryConcerns(org.admin.client, org.id);
		expect(concerns).not.toBeNull();
		expect(concerns).toContain('Compensation');
		expect(concerns).toContain('Travel');
		expect(concerns).not.toContain('');
		// Distinct: two processes share 'Compensation', but it appears once.
		expect(concerns!.filter((c) => c === 'Compensation').length).toBe(1);
	});
});

describe('process queries', () => {
	it('queryProcesses returns the org processes and nothing from other orgs', async () => {
		const process = await newProcess('Queryable');
		const other = await createTestOrg('Other Org');
		const { error: otherError, data: otherid } = await other.admin.db.addProcess(
			other.id,
			'Other Process',
			'org'
		);
		expectNoError(otherError, 'other addProcess');

		const { data, error } = await Organization.queryProcesses(org.admin.client, org.id);
		expect(error).toBeNull();
		const ids = data!.map((p) => p.id);
		expect(ids).toContain(process.id);
		expect(ids).not.toContain(otherid);
		expect(data!.every((p) => p.orgid === org.id)).toBe(true);
	});

	it('queryProcess returns a single process by id', async () => {
		const process = await newProcess('Single');
		const found = await Organization.queryProcess(org.admin.client, process.id);
		expect(found?.id).toBe(process.id);
		expect(found?.title).toBe('Single');
	});

	it('queryProcess returns null for an outsider, who cannot see a private org', async () => {
		const process = await newProcess('Hidden');
		const found = await Organization.queryProcess(org.outsider.client, process.id);
		expect(found).toBeNull();
	});

	it('queryProcessByShortName finds the process by any of its short names', async () => {
		const process = await newProcess('Shortcut');
		const first = `sc-first-${Date.now()}`;
		const second = `sc-second-${Date.now()}`;
		expectOk(await org.admin.db.updateProcessShortName(process, first), 'short one');
		expectOk(await org.admin.db.updateProcessShortName(await reread(process), second), 'short two');

		expect((await Organization.queryProcessByShortName(org.admin.client, org.id, first))?.id).toBe(
			process.id
		);
		expect((await Organization.queryProcessByShortName(org.admin.client, org.id, second))?.id).toBe(
			process.id
		);
		expect(
			await Organization.queryProcessByShortName(org.admin.client, org.id, 'no-such-short-name')
		).toBeNull();
	});

	it('queryProcessChanges returns changes that reference the process', async () => {
		const process = await newProcess('Changed');
		const unrelated = await newProcess('Unchanged');

		const { data: change, error } = await org.admin.db.createChange(
			org.admin.id,
			org.id,
			'Simplify the process',
			'It takes too long.',
			'org',
			[process.id],
			[]
		);
		expectNoError(error, 'createChange');

		const { data: found, error: queryError } = await Organization.queryProcessChanges(
			org.admin.client,
			process.id
		);
		expect(queryError).toBeNull();
		expect(found!.map((c) => c.id)).toContain(change!.id);

		const { data: none } = await Organization.queryProcessChanges(org.admin.client, unrelated.id);
		expect(none!.map((c) => c.id)).not.toContain(change!.id);
	});

	it('getProcessHows filters hows down to one process', async () => {
		const a = await newProcess('Hows A');
		const b = await newProcess('Hows B');
		// Give A a second how so filtering is doing real work.
		const { error: createError } = await org.admin.db.createHow(a, 'org');
		expectNoError(createError, 'createHow');

		const { data: hows, error } = await Organization.queryHows(org.admin.client, org.id);
		expect(error).toBeNull();

		const aHows = Organization.getProcessHows(hows!, a.id);
		const bHows = Organization.getProcessHows(hows!, b.id);
		expect(aHows.length).toBe(2);
		expect(aHows.every((h) => h.processid === a.id)).toBe(true);
		expect(aHows.map((h) => h.id)).toContain(a.howid);
		expect(bHows.map((h) => h.id)).toEqual([b.howid]);
	});
});

describe('process deletion', () => {
	it('deleteProcess removes the process and cascades to its hows', async () => {
		const process = await newProcess('Doomed');
		const howid = process.howid!;

		const { error } = await org.admin.db.deleteProcess(process.id);
		expectNoError(error, 'deleteProcess');

		expect(await readRow('processes', process.id)).toBeNull();
		expect(await readRow('hows', howid)).toBeNull();
	});
});

describe('process access control', () => {
	// Regression: the delete policy compared `accountable = NULL`, which is never true, so the
	// "anyone in the org may delete a process nobody is accountable for" branch was dead code and
	// members were blocked from deleting unowned processes. It now uses `accountable is null`.
	it('a member can delete a process that has no accountable role', async () => {
		const process = await newProcess('Nobody Accountable');
		expect(process.accountable).toBeNull();

		expectNoError((await org.member.db.deleteProcess(process.id)).error, 'deleteProcess');
		expect(await readRow('processes', process.id)).toBeNull();
	});

	it('a member not assigned to the accountable role cannot delete a process', async () => {
		const process = await newProcess('Member Protected');
		const { data: role, error: roleError } = await org.admin.db.createRole(org.id, 'Owner');
		expectNoError(roleError, 'createRole');
		expectOk(
			await org.admin.db.updateProcessAccountable(process, role!.id),
			'updateProcessAccountable'
		);

		await org.member.db.deleteProcess(process.id);
		// RLS filters the delete rather than erroring, so assert the row survived.
		expect(await readRow('processes', process.id)).not.toBeNull();
	});

	it('a member assigned to the accountable role can delete a process', async () => {
		const process = await newProcess('Accountable Member Deletes');
		const { data: role, error: roleError } = await org.admin.db.createRole(org.id, 'Steward');
		expectNoError(roleError, 'createRole');
		expectOk(
			await org.admin.db.updateProcessAccountable(process, role!.id),
			'updateProcessAccountable'
		);
		expectOk(
			await org.admin.db.assignPerson(org.id, org.member.profileid, role!.id),
			'assignPerson'
		);

		expectNoError((await org.member.db.deleteProcess(process.id)).error, 'deleteProcess');
		expect(await readRow('processes', process.id)).toBeNull();
	});

	it('an outsider cannot delete a process', async () => {
		const process = await newProcess('Outsider Protected');
		await org.outsider.db.deleteProcess(process.id);
		expect(await readRow('processes', process.id)).not.toBeNull();
	});

	it('an outsider cannot rename a process', async () => {
		const process = await newProcess('Outsider Rename');
		await org.outsider.db.updateProcessTitle(process, 'Hijacked', org.outsider.id);
		expect((await reread(process)).title).toBe('Outsider Rename');
	});

	it('an outsider cannot create a process in the org', async () => {
		const { data: id } = await org.outsider.db.addProcess(org.id, 'Intruder', 'org');
		expect(id).toBeNull();
	});
});
