// @vitest-environment happy-dom
import { test, expect } from 'vitest';
import { renderMarkup, renderBlock } from './render';
import { readDocument, readBlockSource } from './read';
import { parse } from '../../markup/parser';
import { serialize } from '../../markup/serializer';
import { corpus } from '../../markup/testdata';
import type Markup from '../../markup/Markup';
import Paragraph from '../../markup/Paragraph';

function counter() {
	let next = 0;
	return () => `b${next++}`;
}

function render(markup: Markup): HTMLElement {
	const container = document.createElement('div');
	container.appendChild(renderMarkup(document, markup, counter()));
	return container;
}

test('rendering and reading back preserves the tree', () => {
	const failures: string[] = [];
	for (const tree of corpus(500)) {
		const read = readDocument(render(tree)).toString();
		if (read !== tree.toString()) failures.push(`expected: ${tree}\nactual:   ${read}`);
	}
	expect(failures.slice(0, 3).join('\n\n')).toBe('');
});

test('rendering and reading back preserves the source', () => {
	const failures: string[] = [];
	for (const tree of corpus(500)) {
		const source = serialize(tree);
		const read = serialize(readDocument(render(parse(source))));
		if (read !== source)
			failures.push(`expected: ${JSON.stringify(source)}\nactual:   ${JSON.stringify(read)}`);
	}
	expect(failures.slice(0, 3).join('\n\n')).toBe('');
});

test('every block is marked so a selection can be traced back to it', () => {
	const container = render(parse('# Title\n\n- one\n- two\n\n"quoted"\n\nplain'));
	const blocks = Array.from(container.children);
	expect(blocks.map((b) => b.tagName.toLowerCase())).toEqual(['h3', 'ul', 'blockquote', 'p']);
	expect(blocks.map((b) => b.getAttribute('data-block'))).toEqual(['b0', 'b1', 'b2', 'b3']);
});

test('one block reads back to just its own source', () => {
	const container = render(parse('# Title\n\n- one\n- two\n\nplain *bold* text'));
	expect(readBlockSource(container.children[0])).toBe('# Title');
	expect(readBlockSource(container.children[1])).toBe('- one\n- two');
	expect(readBlockSource(container.children[2])).toBe('plain *bold* text');
});

test('an empty line is still something the caret can reach', () => {
	// A block with no text has no height and cannot be clicked into without a break in it.
	const empty = renderBlock(document, new Paragraph([]), 'b0');
	expect(empty.querySelector('br')).not.toBeNull();
	expect(readBlockSource(empty)).toBe('');
});

test.each([
	// What browsers produce, rather than what the renderer produces.
	['<p><b>bold</b></p>', '*bold*'],
	['<p><i>italic</i></p>', '_italic_'],
	['<p><span style="font-weight:bold">plain</span></p>', 'plain'],
	['<p>a<br>b</p>', 'ab'],
	['<p>sp<span>li</span>t</p>', 'split'],
	['<p><strong>a</strong><strong>b</strong></p>', '*a**b*'],
	// Bold and italic cannot combine, so the outer one wins.
	['<p><strong>bold <em>and italic</em></strong></p>', '*bold and italic*'],
	['<div>a div is just a paragraph</div>', 'a div is just a paragraph'],
	['<h1>top level</h1>', '# top level'],
	['<h5>deep</h5>', '## deep']
])('reading %s', (html: string, expected: string) => {
	const container = document.createElement('div');
	container.innerHTML = html;
	expect(readBlockSource(container.children[0])).toBe(expected);
});

test('a pill reads back as the link or reference it stands for', () => {
	const container = document.createElement('div');
	container.innerHTML =
		'<p>see <span data-pill="reference" data-target="registrar" contenteditable="false">Amy</span>' +
		' and <span data-pill="link" data-target="https://example.com" contenteditable="false">docs</span></p>';
	expect(readBlockSource(container.children[0])).toBe(
		'see <Amy@registrar> and <docs@https://example.com>'
	);
});

test.each([
	// A hyphen only needs escaping where it would start a list, which is the start of a line.
	'a \\* b and C:\\\\shared and - not a hyphen problem',
	'\\- not a list',
	'1\\. not a list',
	'\\# not a heading',
	'\\"not a quote'
])('escaping survives the DOM: %j', (source: string) => {
	expect(serialize(readDocument(render(parse(source))))).toBe(source);
});
