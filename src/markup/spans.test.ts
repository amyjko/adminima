import { test, expect } from 'vitest';
import { parse, parseWithSpans } from './parser';

const Sources = [
	'A single paragraph.',
	'# Title\n\nSome text.\n\n- one\n- two\n\nMore text.',
	'first\n\nsecond\n\nthird',
	'"a quote"\n"and another"\n\nafter the quote',
	'1. one\n2. two\n\n## Sub\n\n* a\n* b',
	'  indented paragraph  \n\n\n\n   another one   ',
	'Text with <Amy@registrar> and <docs@https://example.com>.'
];

test.each(Sources)('spans cover each block of %j', (source: string) => {
	const { markup, spans } = parseWithSpans(source);
	for (const block of markup.blocks) {
		const span = spans.get(block);
		expect(span).toBeDefined();
		const [start, end] = span!;
		// The source a block came from must parse back to that same block on its own, which is what
		// makes it safe to rewrite one block and splice it back into the rest of the source.
		expect(parse(source.slice(start, end)).blocks.map((b) => b.toString())).toEqual([
			block.toString()
		]);
	}
});

test.each(Sources)('spans are ordered and non-overlapping in %j', (source: string) => {
	const { markup, spans } = parseWithSpans(source);
	let previous = 0;
	for (const block of markup.blocks) {
		const [start, end] = spans.get(block)!;
		expect(start).toBeGreaterThanOrEqual(previous);
		expect(end).toBeGreaterThan(start);
		previous = end;
	}
	expect(previous).toBeLessThanOrEqual(source.length);
});
