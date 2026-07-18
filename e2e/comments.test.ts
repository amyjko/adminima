import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Organization, {
	type ChangeRow,
	type CommentRow,
	type ProcessRow,
	type RoleRow
} from '../src/database/Organization';
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

beforeAll(async () => {
	org = await createTestOrg('Comment CRUD');
});

afterAll(cleanup);

/** Create a change owned by the given person. */
async function makeChange(person: TestOrg['admin'], what = 'A change'): Promise<ChangeRow> {
	const { data, error } = await person.db.createChange(person.id, org.id, what, '', 'org', [], []);
	expectNoError(error, 'createChange');
	return data!;
}

async function makeRole(title: string): Promise<RoleRow> {
	const { data, error } = await org.admin.db.createRole(org.id, title);
	expectNoError(error, 'createRole');
	return data!;
}

async function makeProcess(title: string): Promise<ProcessRow> {
	const { data: id, error } = await org.admin.db.addProcess(org.id, title, 'org');
	expectNoError(error, 'addProcess');
	return (await readRow('processes', id!)) as ProcessRow;
}

/** The comment ids currently stored on a parent row, read with the service role. */
async function commentsOn(
	table: 'suggestions' | 'roles' | 'processes' | 'orgs',
	id: string
): Promise<string[]> {
	const { data } = await admin.from(table).select('comments').eq('id', id).single();
	return (data as { comments: string[] } | null)?.comments ?? [];
}

/** The single comment that was appended to a parent by the previous call. */
async function newestComment(
	table: 'suggestions' | 'roles' | 'processes' | 'orgs',
	id: string
): Promise<CommentRow> {
	const ids = await commentsOn(table, id);
	expect(ids.length).toBeGreaterThan(0);
	return (await readRow('comments', ids[ids.length - 1])) as CommentRow;
}

describe('addComment', () => {
	it('inserts a comment and appends it to a change', async () => {
		const change = await makeChange(org.admin, 'Commented change');
		expectOk(
			await org.admin.db.addComment(org.id, 'First thought', 'suggestions', change.id),
			'addComment on change'
		);

		const ids = await commentsOn('suggestions', change.id);
		expect(ids.length).toBe(1);

		const comment = await readRow('comments', ids[0]);
		expect(comment?.what).toBe('First thought');
		expect(comment?.who).toBe(org.admin.id);
		expect(comment?.orgid).toBe(org.id);
	});

	it('appends comments in order, preserving existing ones', async () => {
		const change = await makeChange(org.admin, 'Multi-comment change');

		expectOk(
			await org.admin.db.addComment(org.id, 'One', 'suggestions', change.id),
			'first comment'
		);
		const afterFirst = await commentsOn('suggestions', change.id);

		// The second comment is written by the member, so `who` comes from their session.
		expectOk(
			await org.member.db.addComment(org.id, 'Two', 'suggestions', change.id),
			'second comment'
		);

		const ids = await commentsOn('suggestions', change.id);
		expect(ids.length).toBe(2);
		expect(ids[0]).toBe(afterFirst[0]);

		const { data } = await org.admin.db.getComments(ids);
		const byId = new Map(data?.map((c) => [c.id, c]));
		expect(byId.get(ids[0])?.what).toBe('One');
		expect(byId.get(ids[1])?.what).toBe('Two');
		expect(byId.get(ids[1])?.who).toBe(org.member.id);
	});

	it('appends a comment to a role', async () => {
		const role = await makeRole('Commentable Role');
		expectOk(
			await org.admin.db.addComment(org.id, 'About this role', 'roles', role.id),
			'addComment on role'
		);

		const comment = await newestComment('roles', role.id);
		expect(comment.what).toBe('About this role');
		expect((await commentsOn('roles', role.id)).length).toBe(1);
	});

	it('appends a comment to a process', async () => {
		const process = await makeProcess('Commentable Process');
		expectOk(
			await org.admin.db.addComment(org.id, 'About this process', 'processes', process.id),
			'addComment on process'
		);

		const comment = await newestComment('processes', process.id);
		expect(comment.what).toBe('About this process');
	});

	it('appends a comment to the organization itself', async () => {
		const before = await commentsOn('orgs', org.id);
		expectOk(
			await org.admin.db.addComment(org.id, 'About this org', 'orgs', org.id),
			'addComment on org'
		);

		const after = await commentsOn('orgs', org.id);
		expect(after.length).toBe(before.length + 1);
		expect((await newestComment('orgs', org.id)).what).toBe('About this org');
	});

	it('a member can comment on their own change', async () => {
		const change = await makeChange(org.member, 'Member comments here');
		expectOk(
			await org.member.db.addComment(org.id, 'A member’s two cents', 'suggestions', change.id),
			'member addComment'
		);

		const comment = await newestComment('suggestions', change.id);
		expect(comment.who).toBe(org.member.id);
	});

	// Regression: commenting used to require permission to UPDATE the thing being commented on,
	// because addComment linked the comment by writing the parent's `comments` array directly. A
	// member commenting on someone else's change inserted the comment row but matched zero rows on
	// the link update — no error from PostgREST — so the comment was silently orphaned. Commenting
	// now goes through the add_comment function, which only requires org membership.
	it('a member can comment on another person’s change', async () => {
		const change = await makeChange(org.admin, 'Admin owned, member comments');

		const { error } = await org.member.db.addComment(
			org.id,
			'This should be visible',
			'suggestions',
			change.id
		);
		expect(error).toBeNull();

		// The comment is linked to the change, attributed to the member, and not orphaned.
		const linked = await commentsOn('suggestions', change.id);
		expect(linked.length).toBe(1);

		const comment = await newestComment('suggestions', change.id);
		expect(comment.what).toBe('This should be visible');
		expect(comment.who).toBe(org.member.id);
	});

	it('commenting on a role a member cannot edit still links the comment', async () => {
		// roles UPDATE is admin-only, so this is the same trap as above on a different parent.
		const { data: role } = await org.admin.db.createRole(org.id, 'Commentable Role');
		const { error } = await org.member.db.addComment(org.id, 'Member comment', 'roles', role!.id);
		expect(error).toBeNull();
		expect((await commentsOn('roles', role!.id)).length).toBe(1);
	});

	it('commenting on a parent that does not exist reports an error instead of orphaning', async () => {
		const missing = '00000000-0000-0000-0000-000000000000';
		const { error } = await org.admin.db.addComment(org.id, 'Nowhere', 'suggestions', missing);
		expect(error).not.toBeNull();

		const { data: orphans } = await admin
			.from('comments')
			.select('*')
			.eq('orgid', org.id)
			.eq('what', 'Nowhere');
		expect(orphans ?? []).toEqual([]);
	});

	it('an outsider cannot comment on an org they do not belong to', async () => {
		const change = await makeChange(org.admin, 'Outsider cannot comment');
		const { error } = await org.outsider.db.addComment(
			org.id,
			'Intruder',
			'suggestions',
			change.id
		);
		expect(error).not.toBeNull();
		expect(await commentsOn('suggestions', change.id)).toEqual([]);
	});

	it('an outsider cannot comment on a private org’s change', async () => {
		const change = await makeChange(org.admin, 'Outsider blocked');
		const { error } = await org.outsider.db.addComment(
			org.id,
			'I should not be here',
			'suggestions',
			change.id
		);
		expect(error).not.toBeNull();
		expect(await commentsOn('suggestions', change.id)).toEqual([]);
	});

	it('an anonymous visitor cannot comment', async () => {
		const change = await makeChange(org.admin, 'Anonymous blocked');
		const anonDb = new Organization(anonClient());
		const { error } = await anonDb.addComment(org.id, 'Signed out', 'suggestions', change.id);
		expect(error).not.toBeNull();
		expect(await commentsOn('suggestions', change.id)).toEqual([]);
	});
});

describe('getComments', () => {
	it('returns the comments for the given ids', async () => {
		const change = await makeChange(org.admin, 'Fetchable comments');
		for (const text of ['Alpha', 'Beta']) {
			expectOk(
				await org.admin.db.addComment(org.id, text, 'suggestions', change.id),
				`addComment ${text}`
			);
		}

		const ids = await commentsOn('suggestions', change.id);
		const { data, error } = await org.admin.db.getComments(ids);
		expect(error).toBeNull();
		expect(data?.length).toBe(2);
		expect(data?.map((c) => c.what).sort()).toEqual(['Alpha', 'Beta']);
	});

	it('returns an empty list for no ids', async () => {
		const { data, error } = await org.admin.db.getComments([]);
		expect(error).toBeNull();
		expect(data).toEqual([]);
	});

	it('does not return comments of an org the caller is not in', async () => {
		const change = await makeChange(org.admin, 'Hidden comments');
		expectOk(
			await org.admin.db.addComment(org.id, 'Secret', 'suggestions', change.id),
			'addComment'
		);
		const ids = await commentsOn('suggestions', change.id);

		const { data } = await org.outsider.db.getComments(ids);
		expect(data ?? []).toEqual([]);
	});
});

describe('updateComment', () => {
	it('changes the text of a comment', async () => {
		const change = await makeChange(org.admin, 'Editable comment');
		expectOk(
			await org.admin.db.addComment(org.id, 'Before', 'suggestions', change.id),
			'addComment'
		);
		const comment = await newestComment('suggestions', change.id);

		expectOk(await org.admin.db.updateComment(comment, 'After'), 'updateComment');
		expect((await readRow('comments', comment.id))?.what).toBe('After');
	});

	it('the author can edit their own comment', async () => {
		const change = await makeChange(org.member, 'Member edits own comment');
		expectOk(
			await org.member.db.addComment(org.id, 'Member wrote this', 'suggestions', change.id),
			'addComment'
		);
		const comment = await newestComment('suggestions', change.id);

		expectOk(await org.member.db.updateComment(comment, 'Member edited this'), 'self edit');
		expect((await readRow('comments', comment.id))?.what).toBe('Member edited this');
	});

	// Regression: the comments UPDATE policy used to be a bare `ismember(orgid)`, so any member could
	// rewrite anyone else's words, while DELETE was correctly limited to the author or an admin. Edit
	// now matches delete.
	it('a member cannot edit another person’s comment', async () => {
		const change = await makeChange(org.admin, 'Cross edit');
		expectOk(
			await org.admin.db.addComment(org.id, 'Admin wrote this', 'suggestions', change.id),
			'addComment'
		);
		const comment = await newestComment('suggestions', change.id);

		await org.member.db.updateComment(comment, 'Member edited it');
		expect((await readRow('comments', comment.id))?.what).toBe('Admin wrote this');
	});

	it('an admin can edit another person’s comment', async () => {
		const change = await makeChange(org.member, 'Admin moderates');
		expectOk(
			await org.member.db.addComment(org.id, 'Member wrote this', 'suggestions', change.id),
			'addComment'
		);
		const comment = await newestComment('suggestions', change.id);

		expectOk(await org.admin.db.updateComment(comment, 'Admin edited it'), 'admin edit');
		expect((await readRow('comments', comment.id))?.what).toBe('Admin edited it');
	});

	it('an outsider cannot edit a comment', async () => {
		const change = await makeChange(org.admin, 'Outsider edit blocked');
		expectOk(
			await org.admin.db.addComment(org.id, 'Untouchable', 'suggestions', change.id),
			'addComment'
		);
		const comment = await newestComment('suggestions', change.id);

		await org.outsider.db.updateComment(comment, 'Outsider was here');
		expect((await readRow('comments', comment.id))?.what).toBe('Untouchable');
	});
});

describe('deleteComment', () => {
	it('removes the comment row and unlinks it from the change', async () => {
		const change = await makeChange(org.admin, 'Deletable comment');
		expectOk(await org.admin.db.addComment(org.id, 'Keep', 'suggestions', change.id), 'first');
		expectOk(
			await org.admin.db.addComment(org.id, 'Delete me', 'suggestions', change.id),
			'second'
		);

		const ids = await commentsOn('suggestions', change.id);
		expect(ids.length).toBe(2);

		const current = (await readRow('suggestions', change.id)) as ChangeRow;
		expectOk(await org.admin.db.deleteComment(current, 'suggestions', ids[1]), 'deleteComment');

		expect(await commentsOn('suggestions', change.id)).toEqual([ids[0]]);
		expect(await readRow('comments', ids[1])).toBeNull();
		expect(await readRow('comments', ids[0])).not.toBeNull();
	});

	it('removes a comment from a role', async () => {
		const role = await makeRole('Role with comment');
		expectOk(await org.admin.db.addComment(org.id, 'Role note', 'roles', role.id), 'addComment');
		const ids = await commentsOn('roles', role.id);

		const current = (await readRow('roles', role.id)) as RoleRow;
		expectOk(await org.admin.db.deleteComment(current, 'roles', ids[0]), 'deleteComment');

		expect(await commentsOn('roles', role.id)).toEqual([]);
		expect(await readRow('comments', ids[0])).toBeNull();
	});

	it('removes a comment from a process', async () => {
		const process = await makeProcess('Process with comment');
		expectOk(
			await org.admin.db.addComment(org.id, 'Process note', 'processes', process.id),
			'addComment'
		);
		const ids = await commentsOn('processes', process.id);

		const current = (await readRow('processes', process.id)) as ProcessRow;
		expectOk(await org.admin.db.deleteComment(current, 'processes', ids[0]), 'deleteComment');

		expect(await commentsOn('processes', process.id)).toEqual([]);
		expect(await readRow('comments', ids[0])).toBeNull();
	});

	it('the author can delete their own comment on their own change', async () => {
		const change = await makeChange(org.member, 'Member owns this');
		expectOk(
			await org.member.db.addComment(org.id, 'Mine', 'suggestions', change.id),
			'addComment'
		);
		const ids = await commentsOn('suggestions', change.id);

		const current = (await readRow('suggestions', change.id)) as ChangeRow;
		expectOk(await org.member.db.deleteComment(current, 'suggestions', ids[0]), 'self delete');

		expect(await readRow('comments', ids[0])).toBeNull();
		expect(await commentsOn('suggestions', change.id)).toEqual([]);
	});

	it('an admin can delete another person’s comment', async () => {
		const change = await makeChange(org.member, 'Admin deletes member comment');
		expectOk(
			await org.member.db.addComment(org.id, 'Member said this', 'suggestions', change.id),
			'addComment'
		);
		const ids = await commentsOn('suggestions', change.id);

		const current = (await readRow('suggestions', change.id)) as ChangeRow;
		expectOk(await org.admin.db.deleteComment(current, 'suggestions', ids[0]), 'admin delete');
		expect(await readRow('comments', ids[0])).toBeNull();
	});

	// The delete policy on comments is `isAdmin(orgid) or who = auth.uid()`, so an unrelated
	// member must not be able to delete a comment they did not write.
	// Regression: deleteComment used to unlink the comment from its parent and only then delete the
	// row, as two statements under the caller's own permissions. A caller who could update the parent
	// but not delete the comment unlinked it and then failed — hiding someone else's comment while
	// leaving the row behind. Deleting must now be all-or-nothing, so assert the comment is still
	// LINKED, not merely that the row exists.
	it('an unrelated member cannot delete or unlink another person’s comment', async () => {
		const change = await makeChange(org.member, 'Member owns the change');
		expectOk(
			await org.admin.db.addComment(org.id, 'Admin wrote this', 'suggestions', change.id),
			'addComment'
		);
		const ids = await commentsOn('suggestions', change.id);

		// The member owns the change, so they may update it — but not delete the admin's comment.
		const current = (await readRow('suggestions', change.id)) as ChangeRow;
		await org.member.db.deleteComment(current, 'suggestions', ids[0]);

		expect((await readRow('comments', ids[0]))?.what).toBe('Admin wrote this');
		expect(await commentsOn('suggestions', change.id)).toEqual(ids);
	});

	// The same trap on a process with no accountable role, where the processes UPDATE policy admits
	// any member — the widest path to unlinking a comment you are not allowed to delete.
	it('a member cannot unlink another person’s comment on an unowned process', async () => {
		const process = await makeProcess('Unowned process');
		expectOk(
			await org.admin.db.addComment(org.id, 'Admin comment', 'processes', process.id),
			'addComment'
		);
		const ids = await commentsOn('processes', process.id);

		const current = (await readRow('processes', process.id)) as ProcessRow;
		await org.member.db.deleteComment(current, 'processes', ids[0]);

		expect((await readRow('comments', ids[0]))?.what).toBe('Admin comment');
		expect(await commentsOn('processes', process.id)).toEqual(ids);
	});

	it('the author can delete their own comment, unlinking it too', async () => {
		const change = await makeChange(org.admin, 'Author deletes own');
		expectOk(
			await org.member.db.addComment(org.id, 'Member wrote this', 'suggestions', change.id),
			'addComment'
		);
		const ids = await commentsOn('suggestions', change.id);

		const current = (await readRow('suggestions', change.id)) as ChangeRow;
		expectOk(
			await org.member.db.deleteComment(current, 'suggestions', ids[0]),
			'author deleteComment'
		);

		expect(await readRow('comments', ids[0])).toBeNull();
		expect(await commentsOn('suggestions', change.id)).toEqual([]);
	});

	it('an outsider cannot delete a comment', async () => {
		const change = await makeChange(org.admin, 'Outsider delete blocked');
		expectOk(await org.admin.db.addComment(org.id, 'Safe', 'suggestions', change.id), 'addComment');
		const ids = await commentsOn('suggestions', change.id);

		const current = (await readRow('suggestions', change.id)) as ChangeRow;
		await org.outsider.db.deleteComment(current, 'suggestions', ids[0]);

		expect(await readRow('comments', ids[0])).not.toBeNull();
		expect(await commentsOn('suggestions', change.id)).toEqual(ids);
	});
});

describe('comment lifecycle', () => {
	it('deleting a change leaves its comments behind as orphans', async () => {
		const change = await makeChange(org.admin, 'Orphan maker');
		expectOk(
			await org.admin.db.addComment(org.id, 'Orphan', 'suggestions', change.id),
			'addComment'
		);
		const ids = await commentsOn('suggestions', change.id);

		expectNoError((await org.admin.db.deleteChange(change.id)).error, 'deleteChange');
		expect(await readRow('suggestions', change.id)).toBeNull();

		// There is no foreign key from comments to suggestions, so the comment row survives.
		expect(await readRow('comments', ids[0])).not.toBeNull();
	});

	it('deleting the org cascades to its comments', async () => {
		const other = await createTestOrg('Comment Cascade Org');
		const { data: change } = await other.admin.db.createChange(
			other.admin.id,
			other.id,
			'Cascading',
			'',
			'org',
			[],
			[]
		);
		expectOk(
			await other.admin.db.addComment(other.id, 'Will vanish', 'suggestions', change!.id),
			'addComment'
		);
		const { data: row } = await admin
			.from('suggestions')
			.select('comments')
			.eq('id', change!.id)
			.single();
		const commentid = (row as { comments: string[] }).comments[0];
		expect(await readRow('comments', commentid)).not.toBeNull();

		await admin.from('orgs').delete().eq('id', other.id);
		expect(await readRow('comments', commentid)).toBeNull();
	});
});
