import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Organization, { type HowRow, type ProcessRow } from '../src/database/Organization';
import { parse } from '../src/markup/parser';
import { cleanup, createTestOrg, expectNoError, expectOk, readRow, type TestOrg } from './harness';

let org: TestOrg;
/** A role used by the RCI tests. */
let roleid: string;

beforeAll(async () => {
	org = await createTestOrg('How CRUD');
	const { data: role, error } = await org.admin.db.createRole(org.id, 'Approver');
	expectNoError(error, 'createRole');
	roleid = role!.id;
});

afterAll(cleanup);

/** Create a process and return it with its automatically created root how. */
async function newProcess(title: string): Promise<{ process: ProcessRow; root: HowRow }> {
	const { error, data: id } = await org.admin.db.addProcess(org.id, title, 'org');
	expectNoError(error, `addProcess ${title}`);
	const process = (await readRow('processes', id!)) as ProcessRow;
	const root = (await readRow('hows', process.howid!)) as HowRow;
	return { process, root };
}

/** Re-read a how through the service role, so assertions see what really landed. */
async function reread(how: HowRow): Promise<HowRow> {
	const row = await readRow('hows', how.id);
	if (row === null) throw new Error(`how ${how.id} missing`);
	return row as HowRow;
}

/** Add a child how at the end of a parent, returning the fresh child and parent rows. */
async function appendChild(
	process: ProcessRow,
	parent: HowRow
): Promise<{ child: HowRow; parent: HowRow }> {
	const { error, data: id } = await org.admin.db.insertHow(
		process,
		'org',
		parent,
		parent.how.length
	);
	expectNoError(error, 'insertHow');
	return {
		child: (await readRow('hows', id!)) as HowRow,
		parent: await reread(parent)
	};
}

describe('how creation and fields', () => {
	it('createHow creates a detached how belonging to the process', async () => {
		const { process, root } = await newProcess('Create How');
		const { data: how, error } = await org.admin.db.createHow(process, 'org');
		expectNoError(error, 'createHow');

		expect(how).not.toBeNull();
		const row = await readRow('hows', how!.id);
		expect(row?.processid).toBe(process.id);
		expect(row?.orgid).toBe(org.id);
		expect(row?.what).toBe('');
		expect(row?.visibility).toBe('org');
		expect(row?.done).toBe('no');
		expect(row?.how).toEqual([]);
		// createHow does not attach the how to any parent.
		expect((await reread(root)).how).not.toContain(how!.id);
	});

	it('updateHowText stores markup that parses into blocks', async () => {
		const { process } = await newProcess('Text How');
		const { data: how } = await org.admin.db.createHow(process, 'org');

		const markup = 'Do the thing.\n\n* First\n* Second';
		expectOk(await org.admin.db.updateHowText(how!, markup), 'updateHowText');

		const stored = await reread(how!);
		expect(stored.what).toBe(markup);
		// The stored value is valid markup: a paragraph plus a bulleted list.
		expect(parse(stored.what).blocks.length).toBe(2);
	});

	it('updateHowVisibility changes visibility', async () => {
		const { process } = await newProcess('Visible How');
		const { data: how } = await org.admin.db.createHow(process, 'org');
		expect((await reread(how!)).visibility).toBe('org');

		expectOk(await org.admin.db.updateHowVisibility(how!, 'admin'), 'updateHowVisibility');
		expect((await reread(how!)).visibility).toBe('admin');

		expectOk(
			await org.admin.db.updateHowVisibility(await reread(how!), 'public'),
			'updateHowVisibility public'
		);
		expect((await reread(how!)).visibility).toBe('public');
	});

	it('updateHowDone changes completion', async () => {
		const { process } = await newProcess('Done How');
		const { data: how } = await org.admin.db.createHow(process, 'org');
		expect((await reread(how!)).done).toBe('no');

		expectOk(await org.admin.db.updateHowDone(how!, 'pending'), 'updateHowDone pending');
		expect((await reread(how!)).done).toBe('pending');

		expectOk(await org.admin.db.updateHowDone(await reread(how!), 'yes'), 'updateHowDone yes');
		expect((await reread(how!)).done).toBe('yes');
	});
});

describe('how RCI', () => {
	it('addHowRCI adds a role to each of the three lists independently', async () => {
		const { process } = await newProcess('RCI How');
		const { data: how } = await org.admin.db.createHow(process, 'org');

		expectOk(await org.admin.db.addHowRCI(await reread(how!), roleid, 'responsible'), 'r');
		const afterR = await reread(how!);
		expect(afterR.responsible).toEqual([roleid]);
		expect(afterR.consulted).toEqual([]);
		expect(afterR.informed).toEqual([]);

		expectOk(await org.admin.db.addHowRCI(afterR, roleid, 'consulted'), 'c');
		const afterC = await reread(how!);
		expect(afterC.consulted).toEqual([roleid]);
		expect(afterC.responsible).toEqual([roleid]);

		expectOk(await org.admin.db.addHowRCI(afterC, roleid, 'informed'), 'i');
		const afterI = await reread(how!);
		expect(afterI.informed).toEqual([roleid]);
	});

	it('addHowRCI keeps existing roles when adding another', async () => {
		const { process } = await newProcess('RCI Multiple');
		const { data: how } = await org.admin.db.createHow(process, 'org');
		const { data: second } = await org.admin.db.createRole(org.id, 'Reviewer');

		expectOk(await org.admin.db.addHowRCI(await reread(how!), roleid, 'responsible'), 'first');
		expectOk(await org.admin.db.addHowRCI(await reread(how!), second!.id, 'responsible'), 'second');
		expect((await reread(how!)).responsible).toEqual([roleid, second!.id]);
	});

	it('removeHowRCI removes only the named role from the named list', async () => {
		const { process } = await newProcess('RCI Remove');
		const { data: how } = await org.admin.db.createHow(process, 'org');
		const { data: second } = await org.admin.db.createRole(org.id, 'Observer');

		expectOk(await org.admin.db.addHowRCI(await reread(how!), roleid, 'consulted'), 'add one');
		expectOk(await org.admin.db.addHowRCI(await reread(how!), second!.id, 'consulted'), 'add two');
		expectOk(await org.admin.db.addHowRCI(await reread(how!), roleid, 'informed'), 'add three');

		expectOk(
			await org.admin.db.removeHowRCI(await reread(how!), roleid, 'consulted'),
			'removeHowRCI'
		);
		const after = await reread(how!);
		expect(after.consulted).toEqual([second!.id]);
		// The same role in a different list is untouched.
		expect(after.informed).toEqual([roleid]);
	});
});

describe('how tree structure', () => {
	it('insertHow appends and inserts children at the requested index', async () => {
		const { process, root } = await newProcess('Tree Insert');

		const first = await org.admin.db.insertHow(process, 'org', root, 0);
		expectNoError(first.error, 'insert first');
		let parent = await reread(root);
		expect(parent.how).toEqual([first.data]);

		const last = await org.admin.db.insertHow(process, 'org', parent, parent.how.length);
		expectNoError(last.error, 'insert last');
		parent = await reread(root);
		expect(parent.how).toEqual([first.data, last.data]);

		// Insert between the two.
		const middle = await org.admin.db.insertHow(process, 'org', parent, 1);
		expectNoError(middle.error, 'insert middle');
		parent = await reread(root);
		expect(parent.how).toEqual([first.data, middle.data, last.data]);

		// Every inserted how belongs to the process, and none of them has children yet.
		for (const id of [first.data, middle.data, last.data]) {
			const child = await readRow('hows', id!);
			expect(child?.processid).toBe(process.id);
			expect(child?.how).toEqual([]);
		}
	});

	it('moveHow reorders a child within its parent', async () => {
		const { process, root } = await newProcess('Tree Move');
		const a = await appendChild(process, root);
		const b = await appendChild(process, a.parent);
		const c = await appendChild(process, b.parent);
		expect(c.parent.how).toEqual([a.child.id, b.child.id, c.child.id]);

		// Move the last child to the front.
		expectOk(await org.admin.db.moveHow(c.child, c.parent, 0), 'moveHow to front');
		let parent = await reread(root);
		expect(parent.how).toEqual([c.child.id, a.child.id, b.child.id]);

		// Move it back to the end. The index applies to the list with the how already removed.
		expectOk(await org.admin.db.moveHow(c.child, parent, 2), 'moveHow to end');
		parent = await reread(root);
		expect(parent.how).toEqual([a.child.id, b.child.id, c.child.id]);

		// Move the middle child one slot forward.
		expectOk(await org.admin.db.moveHow(b.child, parent, 0), 'moveHow middle');
		parent = await reread(root);
		expect(parent.how).toEqual([b.child.id, a.child.id, c.child.id]);

		// Moving does not create or destroy hows.
		const { data: hows } = await Organization.queryProcessHows(org.admin.client, process.id);
		expect(hows!.length).toBe(4);
	});

	it('reparentHow moves a how to a new parent at the requested index', async () => {
		const { process, root } = await newProcess('Tree Reparent');
		const a = await appendChild(process, root);
		const b = await appendChild(process, a.parent);
		const c = await appendChild(process, b.parent);

		// Give A two children of its own, so the index in the new parent matters.
		const a1 = await appendChild(process, a.child);
		const a2 = await appendChild(process, a1.parent);
		expect(a2.parent.how).toEqual([a1.child.id, a2.child.id]);

		// Move C from the root to the middle of A's children.
		expectOk(
			await org.admin.db.reparentHow(c.child, await reread(root), a2.parent, 1),
			'reparentHow'
		);

		const rootAfter = await reread(root);
		const aAfter = await reread(a.child);
		expect(rootAfter.how).toEqual([a.child.id, b.child.id]);
		expect(aAfter.how).toEqual([a1.child.id, c.child.id, a2.child.id]);

		// The moved how itself is unchanged and still belongs to the process.
		const moved = await reread(c.child);
		expect(moved.processid).toBe(process.id);
		expect(moved.how).toEqual([]);
	});

	it('reparentHow can move a how back up to the root', async () => {
		const { process, root } = await newProcess('Tree Reparent Up');
		const a = await appendChild(process, root);
		const child = await appendChild(process, a.child);

		expectOk(
			await org.admin.db.reparentHow(child.child, child.parent, await reread(root), 0),
			'reparentHow up'
		);

		expect((await reread(a.child)).how).toEqual([]);
		expect((await reread(root)).how).toEqual([child.child.id, a.child.id]);
	});

	it('deleteHow removes the how and unlinks it from its parent', async () => {
		const { process, root } = await newProcess('Tree Delete');
		const a = await appendChild(process, root);
		const b = await appendChild(process, a.parent);
		const c = await appendChild(process, b.parent);

		expectOk(await org.admin.db.deleteHow(await reread(root), b.child), 'deleteHow');

		expect(await readRow('hows', b.child.id)).toBeNull();
		expect((await reread(root)).how).toEqual([a.child.id, c.child.id]);

		const { data: hows } = await Organization.queryProcessHows(org.admin.client, process.id);
		expect(hows!.length).toBe(3);
	});
});

describe('how queries and helpers', () => {
	it('queryHows returns every how in the org and nothing from another org', async () => {
		const { process, root } = await newProcess('Query Hows');
		const child = await appendChild(process, root);

		const other = await createTestOrg('Other How Org');
		const otherProcess = await other.admin.db.addProcess(other.id, 'Other', 'org');
		const otherRoot = (await readRow('processes', otherProcess.data!))!.howid;

		const { data, error } = await Organization.queryHows(org.admin.client, org.id);
		expect(error).toBeNull();
		const ids = data!.map((h) => h.id);
		expect(ids).toContain(root.id);
		expect(ids).toContain(child.child.id);
		expect(ids).not.toContain(otherRoot);
		expect(data!.every((h) => h.orgid === org.id)).toBe(true);
	});

	it('queryProcessHows returns only the hows of one process', async () => {
		const a = await newProcess('Process Hows A');
		const b = await newProcess('Process Hows B');
		const childA = await appendChild(a.process, a.root);

		const { data, error } = await Organization.queryProcessHows(org.admin.client, a.process.id);
		expect(error).toBeNull();
		expect(data!.map((h) => h.id).sort()).toEqual([a.root.id, childA.child.id].sort());
		expect(data!.map((h) => h.id)).not.toContain(b.root.id);
	});

	it('getHow finds a how by id among real rows', async () => {
		const { process, root } = await newProcess('Get How');
		const child = await appendChild(process, root);

		const { data: hows } = await Organization.queryProcessHows(org.admin.client, process.id);
		expect(Organization.getHow(hows!, child.child.id)?.id).toBe(child.child.id);
		expect(Organization.getHow(hows!, root.id)?.id).toBe(root.id);
		expect(Organization.getHow(hows!, '00000000-0000-0000-0000-000000000000')).toBeUndefined();
	});

	it('getHowParent finds the parent of a how, and none for the root', async () => {
		const { process, root } = await newProcess('Get How Parent');
		const a = await appendChild(process, root);
		const grandchild = await appendChild(process, a.child);

		const { data: hows } = await Organization.queryProcessHows(org.admin.client, process.id);
		expect(Organization.getHowParent(hows!, a.child.id)?.id).toBe(root.id);
		expect(Organization.getHowParent(hows!, grandchild.child.id)?.id).toBe(a.child.id);
		// The root how has no parent.
		expect(Organization.getHowParent(hows!, root.id)).toBeUndefined();
	});
});

describe('how access control', () => {
	it('an outsider cannot create a how in the org', async () => {
		const { process } = await newProcess('Outsider How');
		const { data, error } = await org.outsider.db.createHow(process, 'org');
		expect(data).toBeNull();
		expect(error).not.toBeNull();
	});

	it('an outsider cannot delete a how', async () => {
		const { process, root } = await newProcess('Outsider Delete How');
		const child = await appendChild(process, root);

		await org.outsider.db.deleteHow(await reread(root), child.child);
		expect(await readRow('hows', child.child.id)).not.toBeNull();
	});

	it('an outsider cannot read the hows of a private org', async () => {
		const { process } = await newProcess('Outsider Read How');
		const { data } = await Organization.queryProcessHows(org.outsider.client, process.id);
		expect(data).toEqual([]);
	});
});
