import { describe, it, expect } from 'vitest';
import {
	uuidArrayLiteral,
	keyPredicate,
	insertStatement,
	referenceUpdate,
	arrayMergeUpdate,
	withTriggerDisabled
} from './sql.js';

/**
 * Unit tests for the pure statement builders.
 *
 * These deliberately touch no database and need no Docker, so they run under `npm run test:unit`
 * alongside everything else. The parts that do need a database are covered by the rehearsal in
 * restore/README.md, which is the only way to prove the generated SQL actually applies.
 */

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const C = '00000000-0000-0000-0000-00000000000c';

describe('uuidArrayLiteral', () => {
	it('renders the empty array as a cast literal, since array[] is not valid SQL', () => {
		expect(uuidArrayLiteral([])).toBe(`'{}'::uuid[]`);
	});

	it('renders a populated array', () => {
		expect(uuidArrayLiteral([A, B])).toBe(`array['${A}', '${B}']::uuid[]`);
	});
});

describe('keyPredicate', () => {
	it('matches a single-column key', () => {
		expect(keyPredicate(['id'])).toBe(
			'("id") in (select k0 from unnest($1::uuid[]) as keyset(k0))'
		);
	});

	it('matches a composite key as a tuple, not a cross product', () => {
		// assignments has no id; its key is (roleid, profileid). Matching each column independently
		// would select every combination of the two, which is not the same set of rows.
		expect(keyPredicate(['roleid', 'profileid'])).toBe(
			'("roleid", "profileid") in (select k0, k1 from unnest($1::uuid[], $2::uuid[]) as keyset(k0, k1))'
		);
	});

	it('qualifies columns when given a prefix', () => {
		expect(keyPredicate(['id'], 't.')).toContain('(t."id")');
	});
});

describe('insertStatement', () => {
	it('produces nothing for no rows', () => {
		expect(insertStatement('roles', ['id'], [], ['id'])).toBe('');
	});

	it('quotes identifiers, since "when" and "how" are reserved words', () => {
		const sql = insertStatement('roles', ['id', 'when'], [`('${A}'::uuid, now())`], ['id']);
		expect(sql).toContain('insert into public."roles" ("id", "when") values');
	});

	it('never overwrites an existing row', () => {
		// do nothing, never do update: an id that reappeared in the target since generation is
		// live truth, and this is what makes re-running the file safe.
		const sql = insertStatement('roles', ['id'], [`('${A}'::uuid)`], ['id']);
		expect(sql).toContain('on conflict ("id") do nothing;');
		expect(sql).not.toContain('do update');
	});

	it('uses the composite key as the conflict target', () => {
		const sql = insertStatement(
			'assignments',
			['roleid', 'profileid'],
			[`('${A}'::uuid, '${B}'::uuid)`],
			['roleid', 'profileid']
		);
		expect(sql).toContain('on conflict ("roleid", "profileid") do nothing;');
	});

	it('splits large sets into separate statements so each stays reviewable', () => {
		const tuples = Array.from({ length: 1200 }, (_, i) => `('${i}')`);
		const sql = insertStatement('comments', ['id'], tuples, ['id']);
		expect(sql.match(/insert into/g)).toHaveLength(3);
	});
});

describe('referenceUpdate', () => {
	it('produces nothing for no pairs', () => {
		expect(referenceUpdate('processes', 'howid', [], 'hows')).toBe('');
	});

	it('refuses to clobber a pointer the target already has', () => {
		const sql = referenceUpdate('processes', 'accountable', [[A, B]], 'roles');
		expect(sql).toContain('and t."accountable" is null');
	});

	it('guards on the referent existing, so one bad row cannot abort the transaction', () => {
		const sql = referenceUpdate('processes', 'howid', [[A, B]], 'hows');
		expect(sql).toContain('and exists (select 1 from public."hows" r where r."id" = v.value)');
	});
});

describe('arrayMergeUpdate', () => {
	it('produces nothing when the backup array is empty', () => {
		expect(arrayMergeUpdate('hows', A, 'how', [], 'hows')).toBe('');
	});

	it("restores the backup's order rather than appending", () => {
		// hows.how IS the step tree -- there is no parent foreign key -- so a restored step has to
		// come back at its original index. Appending would silently reorder the process.
		const sql = arrayMergeUpdate('hows', A, 'how', [B, C], 'hows');
		expect(sql).toContain('with ordinality as w(id, ord)');
		expect(sql).toContain('array_agg(w.id order by w.ord)');
	});

	it('keeps entries the target has gained since the backup', () => {
		const sql = arrayMergeUpdate('hows', A, 'how', [B], 'hows');
		expect(sql).toContain('where not (kept = any(');
	});

	it('coalesces both halves, so an empty side cannot blank the column', () => {
		// array_agg over no rows returns NULL, and NULL || anything is NULL. Without the
		// coalesce, repairing a row whose ids were all deleted would empty a NOT NULL column.
		const sql = arrayMergeUpdate('hows', A, 'how', [B], 'hows');
		expect(sql.match(/coalesce\(\(/g)).toHaveLength(2);
		expect(sql.match(/'\{\}'::uuid\[\]/g)).toHaveLength(2);
	});

	it('drops ids that no longer exist anywhere', () => {
		const sql = arrayMergeUpdate('roles', A, 'comments', [B], 'comments');
		expect(sql).toContain('where exists (select 1 from public."comments" r where r."id" = w.id)');
	});
});

describe('withTriggerDisabled', () => {
	it('re-enables the trigger afterwards', () => {
		const sql = withTriggerDisabled('profiles', 'on_profile_create', 'insert into x;');
		expect(sql).toContain('disable trigger on_profile_create');
		expect(sql).toContain('enable trigger on_profile_create');
		expect(sql.indexOf('disable')).toBeLessThan(sql.indexOf('enable'));
	});
});
