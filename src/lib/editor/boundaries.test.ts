import { test, expect } from 'vitest';
import { parse } from '../../markup/parser';
import { serialize } from '../../markup/serializer';
import { split, mergeBackward, deleteRange, type Position } from './commands';
import Markup from '../../markup/Markup';
import Bullets from '../../markup/Bullets';
import Characters from '../../markup/Text';

/**
 * Enter and Backspace at every boundary the grammar has.
 *
 * This is the matrix that eats most of an editor's bug budget: what Enter does at the end of a
 * heading, what Backspace does at the top of a quote, where the caret lands afterwards. It is a
 * table here rather than a browser suite because the commands are transforms on a document, which
 * is most of the reason they were written that way.
 */

function at(block: number, line: number, offset: number): Position {
	return { block, line, offset };
}

test.each([
	// -- Paragraphs --
	['mid paragraph', 'hello world', at(0, 0, 5), 'hello\n\n world', at(1, 0, 0)],
	['end of paragraph', 'hello', at(0, 0, 5), 'hello\n\n', at(1, 0, 0)],
	['start of paragraph', 'hello', at(0, 0, 0), '\n\nhello', at(1, 0, 0)],

	// -- Headings. What follows a heading is a paragraph, never another heading. --
	['end of heading', '# Title', at(0, 0, 5), '# Title\n\n', at(1, 0, 0)],
	['mid heading', '# Title', at(0, 0, 3), '# Tit\n\nle', at(1, 0, 0)],
	['start of heading', '# Title', at(0, 0, 0), '# \n\nTitle', at(1, 0, 0)],
	['mid subheading', '## Sub', at(0, 0, 2), '## Su\n\nb', at(1, 0, 0)],

	// -- Lists --
	['mid list item', '- one\n- two', at(0, 0, 2), '- on\n- e\n- two', at(0, 1, 0)],
	['end of list item', '- one\n- two', at(0, 0, 3), '- one\n- \n- two', at(0, 1, 0)],
	['start of list item', '- one', at(0, 0, 0), '- \n- one', at(0, 1, 0)],
	['mid numbered item', '1. one\n2. two', at(0, 1, 1), '1. one\n2. t\n3. wo', at(0, 2, 0)],

	// -- Quotes --
	['mid quoted line', '"hello there"', at(0, 0, 5), '"hello"\n" there"', at(0, 1, 0)],
	['end of quoted line', '"one"\n"two"', at(0, 0, 3), '"one"\n""\n"two"', at(0, 1, 0)],
	['start of a quote', '"one"', at(0, 0, 0), '""\n"one"', at(0, 1, 0)]
])('enter: %s', (_name, source, position, expected, landing) => {
	const result = split(parse(source), position);
	expect(serialize(result.markup)).toBe(expected);
	expect(result.position).toEqual(landing);
});

test.each([
	// -- Joining upward across blocks --
	['paragraph into paragraph', 'one\n\ntwo', at(1, 0, 0), 'onetwo', at(0, 0, 3)],
	['paragraph into heading', '# Title\n\nbody', at(1, 0, 0), '# Titlebody', at(0, 0, 5)],
	['paragraph into a list', '- one\n- two\n\nthree', at(1, 0, 0), '- one\n- twothree', at(0, 1, 3)],
	['paragraph into a quote', '"quoted"\n\nbody', at(1, 0, 0), '"quotedbody"', at(0, 0, 6)],
	['heading into paragraph', 'body\n\n# Title', at(1, 0, 0), 'body\n\nTitle', at(1, 0, 0)],

	// -- Backing out of a block, rather than joining upward --
	['start of a heading gives a paragraph', '# Title', at(0, 0, 0), 'Title', at(0, 0, 0)],
	['start of a subheading gives a paragraph', '## Sub', at(0, 0, 0), 'Sub', at(0, 0, 0)],
	['start of a quote gives a paragraph', '"quoted"', at(0, 0, 0), 'quoted', at(0, 0, 0)],
	[
		'start of the first list item leaves the list',
		'- one\n- two',
		at(0, 0, 0),
		'one\n\ntwo',
		at(0, 0, 0)
	],
	['start of the first numbered item leaves the list', '1. one', at(0, 0, 0), 'one', at(0, 0, 0)],

	// -- Joining lines within a block --
	['second list item joins the first', '- one\n- two', at(0, 1, 0), '- onetwo', at(0, 0, 3)],
	['third list item joins the second', '- a\n- b\n- c', at(0, 2, 0), '- a\n- bc', at(0, 1, 1)],
	['second quoted line joins the first', '"one"\n"two"', at(0, 1, 0), '"onetwo"', at(0, 0, 3)],
	['second numbered item joins the first', '1. one\n2. two', at(0, 1, 0), '1. onetwo', at(0, 0, 3)],

	// -- Nothing to join --
	['the very start of the document', 'hello', at(0, 0, 0), 'hello', at(0, 0, 0)],
	['anywhere but the start of a line is the browser’s', 'hello', at(0, 0, 3), 'hello', at(0, 0, 3)]
])('backspace: %s', (_name, source, position, expected, landing) => {
	const result = mergeBackward(parse(source), position);
	expect(serialize(result.markup)).toBe(expected);
	expect(result.position).toEqual(landing);
});

test('backing out of a multi line quote keeps every line', () => {
	const result = mergeBackward(parse('"one"\n"two"\n"three"'), at(0, 0, 0));
	expect(serialize(result.markup)).toBe('one\n\ntwo\n\nthree');
});

test('enter then backspace puts a paragraph back the way it was', () => {
	for (const source of ['hello world', '- one\n- two', '"one"\n"two"', '# Title', '1. one']) {
		const opened = split(parse(source), at(0, 0, 2));
		const closed = mergeBackward(opened.markup, opened.position);
		expect(serialize(closed.markup)).toBe(serialize(parse(source)));
	}
});

test('enter leaves formatting on the side of the split it belongs to', () => {
	const result = split(parse('*bold* and _italic_'), at(0, 0, 4));
	expect(serialize(result.markup)).toBe('*bold*\n\n and _italic_');
});

test('enter beside a reference keeps it whole', () => {
	// One character of the line, so splitting before it and after it are different places.
	const before = split(parse('see <Amy@registrar> now'), at(0, 0, 4));
	expect(serialize(before.markup)).toBe('see \n\n<Amy@registrar> now');
	const after = split(parse('see <Amy@registrar> now'), at(0, 0, 5));
	expect(serialize(after.markup)).toBe('see <Amy@registrar>\n\n now');
});

test('enter on an empty item in the middle splits the list rather than leaving it', () => {
	// A shape the parser will not produce from source, since it trims a bare marker away.
	const list = new Markup([
		new Bullets([[new Characters('', 'one')], [], [new Characters('', 'two')]])
	]);
	const result = split(list, at(0, 1, 0));
	expect(serialize(result.markup)).toBe('- one\n- \n- \n- two');
	expect(result.position).toEqual(at(0, 2, 0));
});

test.each([
	// -- Within one line --
	['a phrase', 'keep remove keep', at(0, 0, 5), at(0, 0, 12), 'keep keep', at(0, 0, 5)],
	['all of a line', 'gone', at(0, 0, 0), at(0, 0, 4), '', at(0, 0, 0)],

	// -- Across the lines of one block --
	['across list items', '- one\n- two\n- three', at(0, 0, 2), at(0, 2, 3), '- onee', at(0, 0, 2)],
	['across quoted lines', '"one"\n"two"', at(0, 0, 1), at(0, 1, 2), '"oo"', at(0, 0, 1)],

	// -- Across blocks. What is left of the first block keeps its kind. --
	['paragraph to paragraph', 'one\n\ntwo', at(0, 0, 1), at(1, 0, 2), 'oo', at(0, 0, 1)],
	[
		'paragraph into a list',
		'intro\n\n- one\n- two',
		at(0, 0, 3),
		at(1, 0, 1),
		'intne\n\n- two',
		at(0, 0, 3)
	],
	[
		'a list into a paragraph',
		'- one\n- two\n\nafter',
		at(0, 0, 2),
		at(1, 0, 3),
		'- oner',
		at(0, 0, 2)
	],
	[
		'a heading into a paragraph',
		'# Title\n\nbody',
		at(0, 0, 2),
		at(1, 0, 2),
		'# Tidy',
		at(0, 0, 2)
	],
	['everything', 'one\n\ntwo', at(0, 0, 0), at(1, 0, 3), '', at(0, 0, 0)]
])('deleting %s', (_name, source, start, end, expected, landing) => {
	const result = deleteRange(parse(source), start, end);
	expect(serialize(result.markup)).toBe(expected);
	expect(result.position).toEqual(landing);
});

test('enter with something selected replaces it rather than leaving it beside the break', () => {
	const result = split(parse('keep remove keep'), at(0, 0, 5), at(0, 0, 12));
	expect(serialize(result.markup)).toBe('keep \n\nkeep');
	expect(result.position).toEqual(at(1, 0, 0));
});

test('enter with a selection spanning blocks replaces all of it', () => {
	const result = split(parse('first line\n\nsecond line'), at(0, 0, 6), at(1, 0, 7));
	expect(serialize(result.markup)).toBe('first \n\nline');
});

test('enter with an empty selection is just enter', () => {
	const collapsed = split(parse('hello world'), at(0, 0, 5), at(0, 0, 5));
	expect(serialize(collapsed.markup)).toBe('hello\n\n world');
});

test('a deletion leaves a reference whole or takes all of it', () => {
	// The pill is one character of the line, between "see " and " now".
	const kept = deleteRange(parse('see <Amy@registrar> now'), at(0, 0, 0), at(0, 0, 4));
	expect(serialize(kept.markup)).toBe('<Amy@registrar> now');
	const taken = deleteRange(parse('see <Amy@registrar> now'), at(0, 0, 4), at(0, 0, 5));
	expect(serialize(taken.markup)).toBe('see  now');
});
