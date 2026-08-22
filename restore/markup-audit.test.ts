import { test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parse, parseWithSpans } from '../src/markup/parser';
import { serialize, serializeBlock } from '../src/markup/serializer';
import Markup from '../src/markup/Markup';
import Paragraph from '../src/markup/Paragraph';
import Characters from '../src/markup/Text';
// @ts-expect-error -- restore/ is plain JavaScript with JSDoc types.
import { connect } from './lib/db.js';

/**
 * Measure what the editor would do to markup people have already written.
 *
 * Two different questions get asked here, and only one of them is frightening.
 *
 *   Does anything mean something different afterwards? That is data loss, and it has to be zero.
 *   Do any of the bytes change? That is normalization -- a bullet marker, some blank lines -- and
 *   it is untidy rather than dangerous.
 *
 * The second is also narrower than it looks. Saving rewrites only the blocks somebody edited, so
 * what matters is not how many documents would change if reserialized whole, but how likely the
 * one block being edited is to be rewritten. All three numbers are reported.
 *
 * Read-only, and skipped unless pointed at a database:
 *
 *   AUDIT_DB_URL=postgresql://... npm run audit:markup
 *
 * Supabase presents a certificate from its own authority rather than a public one, so a connection
 * to anything but the local stack also needs its CA:
 *
 *   AUDIT_DB_CA=~/Downloads/prod-ca-2021.crt
 *
 * Download it from Dashboard -> Settings -> Database. Verification is never turned off to get
 * around this: a connection that cannot prove who it is talking to is not one to send a password
 * down.
 *
 * A url on the command line shows up in ps output and shell history, so it is read from the
 * environment only. Reading .env is deliberately not an option: `npm run stop` copies .env.prod
 * over .env, so .env points at production whenever the local stack is down.
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

/** What the round trip does to one stored value. */
function examine(before: string) {
	// One parse, so that the spans are keyed by the very blocks being looked up. Parsing twice
	// gives two sets of blocks that are equal and not identical, and every lookup misses.
	const { markup: tree, spans } = parseWithSpans(before);
	const after = serialize(tree);
	// Meaning is lost if reading back what we would write gives a different document.
	const lost = parse(after).toString() !== tree.toString();
	let blocks = 0;
	let rewritten = 0;
	for (const block of tree.blocks) {
		const span = spans.get(block);
		if (span === undefined) continue;
		blocks++;
		if (before.slice(span[0], span[1]) !== serializeBlock(block)) rewritten++;
	}

	return { after, lost, changed: after !== before, blocks, rewritten };
}

/**
 * Values that must be reported as changing, and values that must not. A report saying nothing
 * would change is only worth believing if the comparison behind it is known to work -- and a
 * corpus of plain prose produces exactly that report whether the detector works or not.
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

/**
 * How many blocks of a value would be rewritten, and how many it has. This is the number that
 * says what one edit costs, so it is worth knowing it counts rather than assuming it.
 */
const BlockCheck: [markup: string, rewritten: number, blocks: number][] = [
	['* a\n* b', 1, 1],
	['# fine\n\n* rewritten', 1, 2],
	['# fine\n\nalso fine', 0, 2],
	['one\n\n\n\ntwo', 0, 2],
	['#### deep\n\n- fine\n- fine', 1, 2]
];

const url = process.env.AUDIT_DB_URL;

/** Supabase signs its own certificates, so anything but the local stack needs its authority. */
const ca = process.env.AUDIT_DB_CA?.replace(/^~(?=\/)/, process.env.HOME ?? '~');

test.skipIf(!url)(
	'report what the editor would do to stored markup',
	async () => {
		// Prove the detectors before trusting anything they say about the corpus.
		for (const [markup, changes] of SelfCheck)
			expect(examine(markup).changed, `self check: ${JSON.stringify(markup)}`).toBe(changes);
		for (const [markup, rewritten, blocks] of BlockCheck) {
			const result = examine(markup);
			expect([result.rewritten, result.blocks], `blocks: ${JSON.stringify(markup)}`).toEqual([
				rewritten,
				blocks
			]);
		}
		// A trailing space is meaning the parser cannot read back, so the loss detector must see it.
		const trailing = serialize(new Markup([new Paragraph([new Characters('', 'a ')])]));
		expect(parse(trailing).toString()).not.toBe(
			new Markup([new Paragraph([new Characters('', 'a ')])]).toString()
		);

		// connect() checks the file itself; what it does not do is expand a leading ~.
		const client = await connect(url, { label: 'audit', ca });
		const counts = new Map<string, number>();
		const losses: string[] = [];
		const lines: string[] = [];
		let total = 0;
		let exposed = 0;
		let changed = 0;
		let blocks = 0;
		let rewritten = 0;

		try {
			for (const [table, column] of Columns) {
				const { rows } = await client.query(
					`select id, ${column} as value from public.${table} where ${column} is not null and ${column} <> ''`
				);
				for (const row of rows) {
					const before: string = row.value;
					const result = examine(before);
					total++;
					if (Exposed.test(before)) exposed++;
					blocks += result.blocks;
					rewritten += result.rewritten;

					if (result.lost)
						losses.push(
							`--- ${table}.${column} ${row.id}\nbefore: ${JSON.stringify(before)}\n` +
								`after:  ${JSON.stringify(result.after)}`
						);

					if (!result.changed) continue;
					changed++;
					const kind = classify(before, result.after);
					counts.set(kind, (counts.get(kind) ?? 0) + 1);
					lines.push(
						`--- ${table}.${column} ${row.id} [${kind}] ${result.rewritten}/${result.blocks} blocks\n` +
							`before: ${JSON.stringify(before)}\n` +
							`after:  ${JSON.stringify(result.after)}`
					);
				}
			}
		} finally {
			await client.end();
		}

		const percent = (part: number, whole: number) => `${((part / (whole || 1)) * 100).toFixed(1)}%`;

		const summary = [
			`Audited ${total} values across ${Columns.length} columns, ${blocks} blocks in all.`,
			'',
			`Meaning lost:      ${losses.length}  <- has to be zero`,
			`Bytes changed:     ${changed} of ${total} values (${percent(changed, total)}) if reserialized whole`,
			`Blocks rewritten:  ${rewritten} of ${blocks} (${percent(rewritten, blocks)}) <- the odds for any one edit`,
			`In scope at all:   ${exposed} of ${total} (${percent(exposed, total)}); the rest is plain prose`,
			'',
			...[...counts.entries()]
				.sort((a, b) => b[1] - a[1])
				.map(([kind, count]) => `  ${String(count).padStart(6)}  ${kind}`)
		].join('\n');

		const out = path.join('backups', 'markup-audit.txt');
		fs.mkdirSync('backups', { recursive: true });
		fs.writeFileSync(
			out,
			`${summary}\n\n${losses.length > 0 ? `MEANING LOST\n\n${losses.join('\n\n')}\n\n` : ''}` +
				`NORMALIZED\n\n${lines.join('\n\n')}\n`,
			'utf8'
		);

		// Written straight out rather than through console, which the test runner swallows.
		process.stdout.write(`\n${summary}\n\nFull report: ${out}\n\n`);

		// Normalization is expected and is for a person to look at. Losing meaning is not.
		expect(losses.slice(0, 5).join('\n\n')).toBe('');
	},
	120000
);
