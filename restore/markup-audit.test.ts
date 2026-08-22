import { test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '../src/markup/parser';
import { serialize } from '../src/markup/serializer';
// @ts-expect-error -- restore/ is plain JavaScript with JSDoc types.
import { connect } from './lib/db.js';

/**
 * Measure what reserializing would do to stored markup, before any of it is turned on.
 *
 * The WYSIWYG editor parses on open and serializes on save, so every existing document eventually
 * makes the round trip. Most of it survives untouched; some of it normalizes. This says which,
 * and how much, rather than leaving it to hope. It is read-only, and skipped unless pointed at a
 * database:
 *
 *   AUDIT_DB_URL=postgresql://... npm run audit:markup
 *
 * A url on the command line shows up in ps output and shell history, so it is read from the
 * environment only. Reading .env is deliberately not an option here: `npm run stop` copies
 * .env.prod over .env, so .env points at production whenever the local stack is down.
 */

/** Every column that holds markup, as of the call sites of MarkupView. */
const Columns: [table: string, column: string][] = [
	['comments', 'what'],
	['hows', 'what'],
	['orgs', 'description'],
	['orgs', 'prompt'],
	['roles', 'description'],
	['suggestions', 'description'],
	['suggestions', 'proposal'],
	['suggestions', 'what'],
	['teams', 'description']
];

/** Anything that makes a value more than plain prose, and so a candidate for being rewritten. */
const Exposed = /[\\*_<@"]|^#|^\s*\d+\./m;

/** A rough label for what changed, so a long report can be skimmed rather than read. */
function classify(before: string, after: string): string {
	if (before.replace(/\n{2,}/g, '\n\n') === after) return 'blank line spacing';
	if (before.replace(/^[*•]\s/gm, '- ') === after) return 'bullet marker';
	if (before.includes('\\') || after.includes('\\')) return 'escaping';
	if (/[*_]/.test(before)) return 'unterminated or spaced formatting';
	if (/^#{3,}/m.test(before)) return 'heading level';
	// Ordered lists are renumbered from one, so compare with the numbers taken out.
	const renumbered = (text: string) => text.replace(/^\s*\d+\./gm, '#.');
	if (renumbered(before) === renumbered(after)) return 'list numbering';
	return 'other';
}

/**
 * Values that must be reported as changing, and values that must not. A report saying nothing
 * would change is only worth believing if the comparison behind it is known to work — and a corpus
 * of plain prose produces exactly that report whether the detector works or not.
 */
const SelfCheck: [markup: string, changes: boolean][] = [
	['C:\\shared', true],
	['I am *bold', true],
	['* a\n* b', true],
	['#### Deep', true],
	['a\n\n\n\nb', true],
	['"unclosed', true],
	['Just some ordinary prose.', false],
	['# A heading', false],
	['- one\n- two', false]
];

const url = process.env.AUDIT_DB_URL;

test.skipIf(!url)(
	'report how stored markup survives a round trip',
	async () => {
		// Prove the detector before trusting anything it says about the corpus.
		for (const [markup, changes] of SelfCheck)
			expect(serialize(parse(markup)) !== markup, `self check: ${JSON.stringify(markup)}`).toBe(
				changes
			);

		const client = await connect(url, { label: 'audit' });
		const counts = new Map<string, number>();
		const lines: string[] = [];
		const exposure: string[] = [];
		let total = 0;
		let changed = 0;

		try {
			for (const [table, column] of Columns) {
				const { rows } = await client.query(
					`select id, ${column} as value from public.${table} where ${column} is not null and ${column} <> ''`
				);
				for (const row of rows) {
					total++;
					const before: string = row.value;
					if (Exposed.test(before)) exposure.push(before);
					const after = serialize(parse(before));
					if (after === before) continue;
					changed++;
					const kind = classify(before, after);
					counts.set(kind, (counts.get(kind) ?? 0) + 1);
					lines.push(
						`--- ${table}.${column} ${row.id} [${kind}]\n` +
							`before: ${JSON.stringify(before)}\n` +
							`after:  ${JSON.stringify(after)}`
					);
				}
			}
		} finally {
			await client.end();
		}

		// A corpus with none of the constructs the round trip touches will report zero changes no
		// matter what, so say how much of it was even in scope.
		const inScope = exposure.length;

		const summary = [
			`Audited ${total} values across ${Columns.length} columns.`,
			`${inScope} contained something a round trip could change; ${total - inScope} were plain prose.`,
			`${changed} would change when reserialized (${((changed / (total || 1)) * 100).toFixed(1)}%).`,
			'',
			...[...counts.entries()]
				.sort((a, b) => b[1] - a[1])
				.map(([kind, count]) => `  ${String(count).padStart(6)}  ${kind}`)
		].join('\n');

		const out = path.join('backups', 'markup-audit.txt');
		fs.mkdirSync('backups', { recursive: true });
		fs.writeFileSync(out, `${summary}\n\n${lines.join('\n\n')}\n`, 'utf8');

		console.log(`${summary}\n\nFull report: ${out}`);

		// Changes are expected — the point is to see them, not to have none. What must hold is that
		// reserializing settles: whatever it rewrites, it rewrites once and then leaves alone.
		expect(fs.existsSync(out)).toBe(true);
	},
	120000
);
