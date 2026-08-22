import { test, expect } from 'vitest';
import {
	lineLength,
	sliceLine,
	spliceLine,
	splitLine,
	hasMark,
	toggleMark,
	coalesce
} from './segments';
import { parseSegments } from '../../markup/parser';
import Characters from '../../markup/Text';
import type Segment from '../../markup/Segment';

/** Round trip through the grammar, so cases read as markup rather than as constructor calls. */
function line(markup: string): Segment[] {
	return parseSegments(markup);
}

function show(segments: Segment[]): string {
	return segments.map((s) => s.toString()).join('');
}

test('a pill counts as one character and text counts its own', () => {
	expect(lineLength(line('hello'))).toBe(5);
	expect(lineLength(line('a*bc*d'))).toBe(4);
	// Nine letters of "Registrar", one character of the line.
	expect(lineLength(line('a<Registrar@registrar>b'))).toBe(3);
});

test.each([
	['hello', 0, 5, 'Text[hello]'],
	['hello', 1, 4, 'Text[ell]'],
	['hello', 2, 2, ''],
	['a*bc*d', 0, 2, 'Text[a]Text[*b*]'],
	['a*bc*d', 1, 3, 'Text[*bc*]'],
	['a*bc*d', 3, 4, 'Text[d]']
])('slicing %s from %i to %i', (markup, start, end, expected) => {
	expect(show(sliceLine(line(markup), start, end))).toBe(expected);
});

test('a pill is kept only when the slice covers all of it', () => {
	const segments = line('a<Amy@registrar>b');
	expect(show(sliceLine(segments, 1, 2))).toBe('Reference[Amy@registrar]');
	// Half a reference is not something the grammar can say.
	expect(show(sliceLine(segments, 1, 1))).toBe('');
	expect(show(sliceLine(segments, 0, 2))).toBe('Text[a]Reference[Amy@registrar]');
});

test('splicing replaces a range', () => {
	const segments = line('hello world');
	expect(show(spliceLine(segments, 5, 11, []))).toBe('Text[hello]');
	expect(show(spliceLine(segments, 0, 5, [new Characters('', 'goodbye')]))).toBe(
		'Text[goodbye world]'
	);
});

test('splitting a line gives both halves', () => {
	const [before, after] = splitLine(line('a*bc*d'), 2);
	expect(show(before)).toBe('Text[a]Text[*b*]');
	expect(show(after)).toBe('Text[*c*]Text[d]');
});

test('splitting at either end gives an empty half', () => {
	const [before, after] = splitLine(line('hello'), 0);
	expect(show(before)).toBe('');
	expect(show(after)).toBe('Text[hello]');
});

test('a mark is on only when all of the range has it', () => {
	const segments = line('a*bc*d');
	expect(hasMark(segments, 1, 3, '*')).toBe(true);
	expect(hasMark(segments, 0, 3, '*')).toBe(false);
	expect(hasMark(segments, 1, 3, '_')).toBe(false);
	// Nothing selected is not "all of it is bold".
	expect(hasMark(segments, 2, 2, '*')).toBe(false);
});

test('toggling turns a mark on, then off again', () => {
	const plain = line('hello');
	const bold = toggleMark(plain, 0, 5, '*');
	expect(show(bold)).toBe('Text[*hello*]');
	expect(show(toggleMark(bold, 0, 5, '*'))).toBe('Text[hello]');
});

test('toggling part of a line marks only that part', () => {
	expect(show(toggleMark(line('hello'), 1, 3, '*'))).toBe('Text[h]Text[*el*]Text[lo]');
});

test('toggling across a partly marked range marks all of it', () => {
	// Half bold, so the useful thing is to bold the rest rather than unbold the half.
	expect(show(toggleMark(line('*ab*cd'), 0, 4, '*'))).toBe('Text[*abcd*]');
});

test('a mark leaves pills alone', () => {
	const segments = line('a<Amy@registrar>b');
	expect(show(toggleMark(segments, 0, 3, '*'))).toBe('Text[*a*]Reference[Amy@registrar]Text[*b*]');
});

test('marking joins runs that end up saying the same thing', () => {
	// Two bold runs next to each other would serialize as `*a**b*`, which is not what was meant.
	expect(show(toggleMark(line('*a**b*'), 0, 2, '_'))).toBe('Text[_ab_]');
});

test('coalescing drops empty runs and joins matching ones', () => {
	expect(
		show(
			coalesce([
				new Characters('', 'a'),
				new Characters('', ''),
				new Characters('', 'b'),
				new Characters('*', 'c'),
				new Characters('*', 'd')
			])
		)
	).toBe('Text[ab]Text[*cd*]');
});

test('every split of a line puts back together', () => {
	for (const markup of ['hello world', 'a*bc*d', 'a<Amy@registrar>b', '*bold* and _italic_']) {
		const segments = line(markup);
		for (let offset = 0; offset <= lineLength(segments); offset++) {
			const [before, after] = splitLine(segments, offset);
			expect(show(coalesce([...before, ...after]))).toBe(show(coalesce(segments)));
		}
	}
});
