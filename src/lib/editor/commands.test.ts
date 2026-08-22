import { test, expect } from 'vitest';
import Markup from '../../markup/Markup';
import { parse } from '../../markup/parser';
import { serialize } from '../../markup/serializer';
import { split, mergeBackward, setKind, mark, insert, kindOf, type Position } from './commands';
import Characters from '../../markup/Text';
import Reference from '../../markup/Reference';
import Bullets from '../../markup/Bullets';

function after(
	source: string,
	position: Position,
	run: (
		m: ReturnType<typeof parse>,
		p: Position
	) => { markup: ReturnType<typeof parse>; position: Position }
) {
	const result = run(parse(source), position);
	return { source: serialize(result.markup), position: result.position };
}

test('enter in the middle of a paragraph makes two', () => {
	const result = after('hello world', { block: 0, line: 0, offset: 5 }, split);
	expect(result.source).toBe('hello\n\n world');
	expect(result.position).toEqual({ block: 1, line: 0, offset: 0 });
});

test('enter at the end of a heading gives a paragraph, not another heading', () => {
	const result = after('# Title', { block: 0, line: 0, offset: 5 }, split);
	expect(result.source).toBe('# Title\n\n');
	expect(parse('# Title').blocks.length).toBe(1);
	const tree = split(parse('# Title'), { block: 0, line: 0, offset: 5 }).markup;
	expect(kindOf(tree.blocks[1])).toBe('paragraph');
});

test('enter in a list makes another item', () => {
	const result = after('- one\n- two', { block: 0, line: 0, offset: 3 }, split);
	expect(result.source).toBe('- one\n- \n- two');
	expect(result.position).toEqual({ block: 0, line: 1, offset: 0 });
});

test('enter on an empty last item leaves the list', () => {
	// Enter at the end of "one", then Enter again on the empty item it made.
	const opened = split(parse('- one'), { block: 0, line: 0, offset: 3 });
	const exited = split(opened.markup, { block: 0, line: 1, offset: 0 });
	expect(serialize(exited.markup)).toBe('- one\n\n');
	expect(kindOf(exited.markup.blocks[exited.position.block])).toBe('paragraph');
	expect(exited.position).toEqual({ block: 1, line: 0, offset: 0 });
});

test('enter on the only empty line of a list leaves an empty paragraph behind', () => {
	// A list with one empty item, which is a shape the parser will not produce from source.
	const result = split(new Markup([new Bullets([[]])]), { block: 0, line: 0, offset: 0 });
	expect(result.markup.blocks.length).toBe(1);
	expect(kindOf(result.markup.blocks[0])).toBe('paragraph');
	expect(result.position).toEqual({ block: 0, line: 0, offset: 0 });
});

test('backspace at the start of a list item joins it to the one above', () => {
	const result = after('- one\n- two', { block: 0, line: 1, offset: 0 }, mergeBackward);
	expect(result.source).toBe('- onetwo');
	expect(result.position).toEqual({ block: 0, line: 0, offset: 3 });
});

test('backspace at the start of the first list item backs out of the list', () => {
	const tree = mergeBackward(parse('- one\n- two'), { block: 0, line: 0, offset: 0 });
	expect(serialize(tree.markup)).toBe('one\n\ntwo');
	expect(tree.position).toEqual({ block: 0, line: 0, offset: 0 });
});

test('backspace at the start of a paragraph joins it to the block above', () => {
	const result = after('one\n\ntwo', { block: 1, line: 0, offset: 0 }, mergeBackward);
	expect(result.source).toBe('onetwo');
	expect(result.position).toEqual({ block: 0, line: 0, offset: 3 });
});

test('backspace at the start of a paragraph joins it to the last line of a list', () => {
	const tree = mergeBackward(parse('- one\n- two\n\nthree'), { block: 1, line: 0, offset: 0 });
	expect(serialize(tree.markup)).toBe('- one\n- twothree');
	expect(tree.position).toEqual({ block: 0, line: 1, offset: 3 });
});

test('backspace at the very start of the document does nothing', () => {
	const tree = mergeBackward(parse('hello'), { block: 0, line: 0, offset: 0 });
	expect(serialize(tree.markup)).toBe('hello');
});

test('backspace anywhere but the start of a line is left to the browser', () => {
	const tree = mergeBackward(parse('hello'), { block: 0, line: 0, offset: 3 });
	expect(serialize(tree.markup)).toBe('hello');
});

test('changing a list to paragraphs gives one paragraph per item', () => {
	const tree = setKind(
		parse('- one\n- two\n- three'),
		{ block: 0, line: 2, offset: 1 },
		'paragraph'
	);
	expect(serialize(tree.markup)).toBe('one\n\ntwo\n\nthree');
	// The caret was on the third item, so it is now in the third paragraph.
	expect(tree.position).toEqual({ block: 2, line: 0, offset: 1 });
});

test('changing paragraphs to a list keeps the caret where it was', () => {
	const tree = setKind(parse('one'), { block: 0, line: 0, offset: 2 }, 'bullets');
	expect(serialize(tree.markup)).toBe('- one');
	expect(tree.position).toEqual({ block: 0, line: 0, offset: 2 });
});

test('changing to the kind it already is does nothing', () => {
	const before = parse('# Title');
	const tree = setKind(before, { block: 0, line: 0, offset: 1 }, 'heading1');
	expect(tree.markup).toBe(before);
});

test('bold applies across a selection within a line', () => {
	const tree = mark(parse('hello world'), { block: 0, line: 0, offset: 0 }, 5, '*');
	expect(serialize(tree.markup)).toBe('*hello* world');
});

test('bold works with the selection made backwards', () => {
	const tree = mark(parse('hello world'), { block: 0, line: 0, offset: 5 }, 0, '*');
	expect(serialize(tree.markup)).toBe('*hello* world');
});

test('inserting replaces what was selected', () => {
	const tree = insert(parse('hello world'), { block: 0, line: 0, offset: 0 }, 5, [
		new Characters('', 'goodbye')
	]);
	expect(serialize(tree.markup)).toBe('goodbye world');
	expect(tree.position).toEqual({ block: 0, line: 0, offset: 7 });
});

test('inserting a reference puts the caret after it', () => {
	const tree = insert(parse('see  now'), { block: 0, line: 0, offset: 4 }, 4, [
		new Reference('Amy', 'registrar')
	]);
	expect(serialize(tree.markup)).toBe('see <Amy@registrar> now');
	// One character of travel, however long the name is.
	expect(tree.position).toEqual({ block: 0, line: 0, offset: 5 });
});
