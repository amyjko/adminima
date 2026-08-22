import { test, expect } from 'vitest';
import { parse } from './parser';
import { serialize } from './serializer';
import Bullets from './Bullets';
import Characters from './Text';
import Heading from './Heading';
import Link from './Link';
import Markup from './Markup';
import Numbered from './Numbered';
import Paragraph from './Paragraph';
import Quote from './Quote';
import Reference from './Reference';
import type Block from './Block';
import type Segment from './Segment';

/**
 * A deterministic generator of markup trees, used to check that serializing and reparsing is
 * lossless. It generates only trees the parser itself can produce: the serializer normalizes a few
 * degenerate shapes (whitespace just inside a bold run, an empty list item), and those are
 * deliberately out of scope rather than round trip failures.
 */
function random(seed: number): () => number {
	let state = seed;
	return () => {
		state |= 0;
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Fragments chosen to poke at every escape the grammar has, plus scripts that aren't Latin. */
const Fragments = [
	'plain words',
	'*',
	'_',
	'<',
	'>',
	'@',
	'\\',
	'\\d',
	'C:\\shared',
	'#hashtag',
	'"quoted"',
	'- dashed',
	'• dotted',
	'1. numbered',
	'2024. was a year',
	'a@b.com',
	'ends with period.',
	'100% & <tags>',
	'😀 emoji 🎉',
	'日本語のテキスト',
	'مرحبا بالعالم',
	'multiple   spaces',
	'mailto:someone@example.com'
];

const URLs = ['https://example.com', 'http://a.b/c?d=1&e=2', '/org/1/role/2', 'mailto:a@b.com'];
const Targets = ['registrar', 'Chief of Staff', 'onboarding', 'a-role', 'process 7'];

function pick<T>(next: () => number, items: T[]): T {
	return items[Math.floor(next() * items.length)];
}

function segments(next: () => number, count: number): Segment[] {
	const result: Segment[] = [];
	// Two plain runs in a row would merge when reparsed, so never emit them back to back.
	let plain = false;
	for (let index = 0; index < count; index++) {
		const kind = next();
		if (kind < 0.45 && !plain) {
			result.push(new Characters('', pick(next, Fragments)));
			plain = true;
		} else if (kind < 0.65) {
			result.push(new Characters(next() < 0.5 ? '*' : '_', pick(next, Fragments)));
			plain = false;
		} else if (kind < 0.8) {
			result.push(new Link(pick(next, Fragments), pick(next, URLs)));
			plain = false;
		} else if (kind < 0.92) {
			result.push(new Reference(pick(next, Fragments), pick(next, Targets)));
			plain = false;
		} else {
			const email = 'someone@example.com';
			result.push(new Link(email, `mailto:${email}`));
			plain = false;
		}
	}
	// A block with nothing in it serializes to a blank line, which the parser drops.
	return result.length === 0 ? [new Characters('', 'something')] : result;
}

function lines(next: () => number): Segment[][] {
	const count = 1 + Math.floor(next() * 3);
	return Array.from({ length: count }, () => segments(next, 1 + Math.floor(next() * 3)));
}

function block(next: () => number, kind: number): Block {
	if (kind === 0) return new Paragraph(segments(next, 1 + Math.floor(next() * 4)));
	if (kind === 1)
		return new Heading(next() < 0.5 ? 1 : 2, segments(next, 1 + Math.floor(next() * 2)));
	if (kind === 2) return new Bullets(lines(next));
	if (kind === 3) return new Numbered(lines(next));
	return new Quote(lines(next));
}

function markup(next: () => number): Markup {
	const count = 1 + Math.floor(next() * 5);
	const blocks: Block[] = [];
	let previous = -1;
	for (let index = 0; index < count; index++) {
		// Two lists of the same kind in a row would merge into one when reparsed, and the parser
		// can never produce that shape either.
		let kind = Math.floor(next() * 5);
		if (kind === previous && kind >= 2) kind = 0;
		blocks.push(block(next, kind));
		previous = kind;
	}
	return new Markup(blocks);
}

const Cases = Array.from({ length: 2000 }, (_, seed) => markup(random(seed + 1)));

test('serializing and reparsing preserves the tree', () => {
	const failures: string[] = [];
	for (const tree of Cases) {
		const source = serialize(tree);
		const reparsed = parse(source).toString();
		if (reparsed !== tree.toString())
			failures.push(
				`source:   ${JSON.stringify(source)}\nexpected: ${tree}\nactual:   ${reparsed}`
			);
	}
	expect(failures.slice(0, 5).join('\n\n')).toBe('');
});

test('serializing is idempotent', () => {
	const failures: string[] = [];
	for (const tree of Cases) {
		const once = serialize(tree);
		const twice = serialize(parse(once));
		if (once !== twice)
			failures.push(`once:  ${JSON.stringify(once)}\ntwice: ${JSON.stringify(twice)}`);
	}
	expect(failures.slice(0, 5).join('\n\n')).toBe('');
});
