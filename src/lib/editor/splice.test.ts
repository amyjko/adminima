import { test, expect } from 'vitest';
import { parse, parseWithSpans } from '../../markup/parser';
import { serialize } from '../../markup/serializer';
import { spliceSource } from './splice';
import Markup from '../../markup/Markup';
import Paragraph from '../../markup/Paragraph';
import Characters from '../../markup/Text';

/** Edit one block of a document and see what the source becomes. */
function edit(source: string, change: (blocks: Markup) => Markup): string {
	const { markup, spans } = parseWithSpans(source);
	return spliceSource(source, markup, change(markup), spans);
}

function replacing(index: number, text: string) {
	return (markup: Markup) =>
		new Markup(
			markup.blocks.map((block, at) =>
				at === index ? new Paragraph([new Characters('', text)]) : block
			)
		);
}

test('changing nothing rewrites nothing', () => {
	// Source that reserializing would otherwise normalize in four separate ways.
	const source = '* a bullet\n\n\n\nI am *bold\n\n#### deep\n\nC:\\shared';
	expect(edit(source, (m) => m)).toBe(source);
	// And that really is source the serializer would have changed.
	expect(serialize(parse(source))).not.toBe(source);
});

test('editing one block leaves the others byte for byte', () => {
	// Every untouched block here is in a form the serializer would rewrite.
	const source = '* keep this bullet\n\nchange me\n\n#### keep this heading';
	expect(edit(source, replacing(1, 'changed'))).toBe(
		'* keep this bullet\n\nchanged\n\n#### keep this heading'
	);
});

test('editing the first block leaves the rest alone', () => {
	expect(edit('change me\n\n* keep me', replacing(0, 'changed'))).toBe('changed\n\n* keep me');
});

test('editing the last block leaves the rest alone', () => {
	expect(edit('* keep me\n\nchange me', replacing(1, 'changed'))).toBe('* keep me\n\nchanged');
});

test('adding a block does not disturb its neighbours', () => {
	const source = '* first\n\n#### last';
	const result = edit(
		source,
		(markup) =>
			new Markup([
				markup.blocks[0],
				new Paragraph([new Characters('', 'inserted')]),
				markup.blocks[1]
			])
	);
	expect(result).toBe('* first\n\ninserted\n\n#### last');
});

test('removing a block does not disturb its neighbours', () => {
	const source = '* first\n\nremove me\n\n#### last';
	const result = edit(source, (markup) => new Markup([markup.blocks[0], markup.blocks[2]]));
	expect(result).toBe('* first\n\n#### last');
});

test('removing everything gives an empty document', () => {
	expect(edit('one\n\ntwo', () => new Markup([]))).toBe('');
});

test('writing into an empty document works', () => {
	expect(edit('', () => new Markup([new Paragraph([new Characters('', 'first words')])]))).toBe(
		'first words'
	);
});

test('two blocks that look alike are told apart by position', () => {
	const source = 'same\n\nsame\n\nsame';
	expect(edit(source, replacing(1, 'different'))).toBe('same\n\ndifferent\n\nsame');
});

test('what comes out still parses to what went in', () => {
	const source = '* a\n* b\n\nmiddle\n\n"quoted"';
	const result = edit(source, replacing(1, 'replaced'));
	expect(serialize(parse(result))).toBe(serialize(parse('- a\n- b\n\nreplaced\n\n"quoted"')));
});

test('the blank lines between blocks are left as they were', () => {
	// Deliberate spacing in the rest of a document is not the editor's to tidy up.
	const source = 'first\n\n\n\nchange me\n\n\n\nlast';
	expect(edit(source, replacing(1, 'changed'))).toBe('first\n\n\n\nchanged\n\n\n\nlast');
});

test('inserting between blocks keeps the spacing around them', () => {
	const source = 'first\n\n\n\nlast';
	const result = edit(
		source,
		(markup) =>
			new Markup([
				markup.blocks[0],
				new Paragraph([new Characters('', 'middle')]),
				markup.blocks[1]
			])
	);
	// The new block brings its own separator; the original spacing below it survives.
	expect(result).toBe('first\n\nmiddle\n\n\n\nlast');
});
