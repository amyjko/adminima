import { test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parse, parseWithSpans } from '../src/markup/parser';
import { serialize, serializeBlock } from '../src/markup/serializer';
import Markup from '../src/markup/Markup';
import Paragraph from '../src/markup/Paragraph';
import Characters from '../src/markup/Text';
import Heading from '../src/markup/Heading';
import Bullets from '../src/markup/Bullets';
import Numbered from '../src/markup/Numbered';
import Quote from '../src/markup/Quote';
import Link from '../src/markup/Link';
import Reference from '../src/markup/Reference';
import type Block from '../src/markup/Block';
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

function linesOf(block: Block) {
	if (block instanceof Heading) return [block.text];
	if (block instanceof Bullets || block instanceof Numbered) return block.items;
	if (block instanceof Quote) return block.blocks;
	if (block instanceof Paragraph) return [block.segments];
	return [];
}

/**
 * Every character a reader would see, with none of the structure.
 *
 * This is what must not change. The tree around it may: a space moves out of a bold run, a bullet
 * marker becomes a dash, blank lines collapse. None of that is anybody's words going missing, and
 * counting it as loss buries the thing worth being frightened of.
 */
function textOf(markup: Markup): string {
	return markup.blocks
		.map((block) =>
			linesOf(block)
				.map((line) =>
					line
						.map((segment) =>
							segment instanceof Characters
								? segment.text
								: segment instanceof Link
									? `${segment.text}${segment.url}`
									: segment instanceof Reference
										? `${segment.text}${segment.target}`
										: ''
						)
						.join('')
				)
				.join('\n')
		)
		.join('\n');
}

/** What the round trip does to one stored value. */
function examine(before: string) {
	// One parse, so that the spans are keyed by the very blocks being looked up. Parsing twice
	// gives two sets of blocks that are equal and not identical, and every lookup misses.
	const { markup: tree, spans } = parseWithSpans(before);
	const after = serialize(tree);
	const once = parse(after);

	// Words going missing. Nothing else counts, and this must be nothing.
	const dropped = textOf(once) !== textOf(tree);

	// Settling. The first pass normalizes -- a space leaves a bold run, a bullet becomes a dash --
	// and that is fine as long as it is the end of it. A document that keeps changing on every save
	// is being worn away rather than tidied.
	const unstable = parse(serialize(once)).toString() !== once.toString();

	// Same words, different tree: the normalization, which is untidy rather than dangerous.
	const reshaped = !dropped && once.toString() !== tree.toString();
	let blocks = 0;
	let rewritten = 0;
	for (const block of tree.blocks) {
		const span = spans.get(block);
		if (span === undefined) continue;
		blocks++;
		if (before.slice(span[0], span[1]) !== serializeBlock(block)) rewritten++;
	}

	return { after, dropped, unstable, reshaped, changed: after !== before, blocks, rewritten };
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

/**
 * Shapes real documents turn out to be full of, and what each should be called.
 *
 * The first pass at this reported all of these as meaning lost, which buried the question worth
 * asking under four false alarms.
 */
const MeaningCheck: [markup: string, dropped: boolean, unstable: boolean, reshaped: boolean][] = [
	// A space just inside the end of a formatting run stays exactly where it was written.
	['_Overview _', false, false, false],
	['*Undergraduate Research *', false, false, false],
	['_ Rationale_', false, false, false],
	// A stray asterisk opens a run that never closes, which the parser has always read this way.
	// Only the closing marker is added, which the parser was already supplying for itself.
	['(PM)* owns the delivery.', false, false, false],
	// Ordinary prose is not reshaped at all.
	['Nothing remarkable here.', false, false, false],
	['- one\n- two', false, false, false]
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
		for (const [markup, dropped, unstable, reshaped] of MeaningCheck) {
			const result = examine(markup);
			expect(
				[result.dropped, result.unstable, result.reshaped],
				`meaning: ${JSON.stringify(markup)}`
			).toEqual([dropped, unstable, reshaped]);
		}
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
		const unsettled: string[] = [];
		let reshaped = 0;
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

					if (result.reshaped) reshaped++;
					if (result.dropped)
						losses.push(
							`--- ${table}.${column} ${row.id}\nbefore: ${JSON.stringify(before)}\n` +
								`after:  ${JSON.stringify(result.after)}`
						);
					if (result.unstable)
						unsettled.push(
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
			`Words dropped:     ${losses.length}  <- has to be zero`,
			`Never settles:     ${unsettled.length}  <- has to be zero`,
			`Reshaped:          ${reshaped} of ${total} values (${percent(reshaped, total)}); same words, tidier tree`,
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
			`${summary}\n\n${losses.length > 0 ? `WORDS DROPPED\n\n${losses.join('\n\n')}\n\n` : ''}` +
				`${unsettled.length > 0 ? `NEVER SETTLES\n\n${unsettled.join('\n\n')}\n\n` : ''}` +
				`NORMALIZED\n\n${lines.join('\n\n')}\n`,
			'utf8'
		);

		// Written straight out rather than through console, which the test runner swallows.
		process.stdout.write(`\n${summary}\n\nFull report: ${out}\n\n`);

		// Normalization is expected and is for a person to look at. Words going missing is not, and
		// neither is a document that never stops changing. The detail is in the file rather than
		// here: five whole documents in a terminal is not a report anybody can read.
		expect({ dropped: losses.length, unsettled: unsettled.length, report: out }).toEqual({
			dropped: 0,
			unsettled: 0,
			report: out
		});
	},
	120000
);
