// @vitest-environment happy-dom
import { test, expect } from 'vitest';
import { offsetOf, nodeAt, lengthOf, blockAt, lineAt } from './selection';
import { renderMarkup } from './render';
import { parse } from '../../markup/parser';

function build(html: string): Element {
	const container = document.createElement('div');
	container.innerHTML = html;
	return container.children[0];
}

function render(source: string): HTMLElement {
	const container = document.createElement('div');
	let next = 0;
	container.appendChild(renderMarkup(document, parse(source), () => `b${next++}`));
	return container;
}

test('an offset counts the characters a reader would count', () => {
	const line = build('<p>hello</p>');
	expect(lengthOf(line)).toBe(5);
	expect(offsetOf(line, line.firstChild!, 0)).toBe(0);
	expect(offsetOf(line, line.firstChild!, 3)).toBe(3);
	expect(offsetOf(line, line.firstChild!, 5)).toBe(5);
});

test('an offset spans the nodes formatting splits a line into', () => {
	const line = build('<p>a<strong>bc</strong>d</p>');
	expect(lengthOf(line)).toBe(4);
	const bold = line.children[0].firstChild!;
	expect(offsetOf(line, bold, 0)).toBe(1);
	expect(offsetOf(line, bold, 2)).toBe(3);
	expect(offsetOf(line, line.lastChild!, 1)).toBe(4);
});

test('a pill counts as exactly one character', () => {
	const line = build('<p>a<span data-pill="reference" data-target="r">Registrar</span>b</p>');
	// Nine letters of "Registrar", but one character of travel.
	expect(lengthOf(line)).toBe(3);
	expect(offsetOf(line, line.lastChild!, 1)).toBe(3);
});

test('a position inside a pill is a position beside it', () => {
	const line = build('<p>a<span data-pill="reference" data-target="r">Registrar</span>b</p>');
	const pill = line.children[0];
	expect(offsetOf(line, pill.firstChild!, 0)).toBe(1);
	expect(offsetOf(line, pill.firstChild!, 5)).toBe(2);
});

test('a saved offset finds its way back to a node', () => {
	const line = build('<p>a<strong>bc</strong>d</p>');
	for (let offset = 0; offset <= lengthOf(line); offset++) {
		const { node, offset: within } = nodeAt(line, offset);
		// Round tripping through a node and back must land on the same character.
		expect(offsetOf(line, node, within)).toBe(offset);
	}
});

test('a saved offset survives the browser splitting a text node', () => {
	const line = build('<p>hello world</p>');
	const offset = 7;
	// One text node, so the offset into it is the offset into the line.
	expect(nodeAt(line, offset).offset).toBe(7);

	// What typing does: one text node becomes three, saying the same thing.
	line.textContent = '';
	for (const piece of ['hel', 'lo wo', 'rld']) line.appendChild(document.createTextNode(piece));

	// The same character, now the third one of the second node — and still the same offset.
	const found = nodeAt(line, offset);
	expect(found.node).toBe(line.childNodes[1]);
	expect(found.offset).toBe(4);
	expect(offsetOf(line, found.node, found.offset)).toBe(offset);
});

test('an offset past the end lands at the end', () => {
	const line = build('<p>hi</p>');
	const { node, offset } = nodeAt(line, 99);
	expect(offsetOf(line, node, offset)).toBe(2);
});

test('an empty line has a position in it', () => {
	const line = build('<p><br></p>');
	expect(lengthOf(line)).toBe(0);
	const { node } = nodeAt(line, 0);
	expect(node).toBe(line);
});

test('a node traces back to the block and line it sits in', () => {
	const root = render('# Title\n\n- one\n- two\n\n"first"\n"second"');
	const items = root.querySelectorAll('li');
	const block = blockAt(root, items[1].firstChild);
	expect(block?.tagName.toLowerCase()).toBe('ul');
	expect(block?.getAttribute('data-block')).toBe('b1');
	expect(lineAt(block!, items[1].firstChild)?.index).toBe(1);

	const quoted = root.querySelectorAll('blockquote p');
	const quote = blockAt(root, quoted[1].firstChild);
	expect(quote?.tagName.toLowerCase()).toBe('blockquote');
	expect(lineAt(quote!, quoted[1].firstChild)?.index).toBe(1);
});

test('a node outside the editor belongs to no block', () => {
	const root = render('text');
	expect(blockAt(root, document.createElement('div'))).toBeUndefined();
});

test('every position in a rendered document round trips', () => {
	const root = render(
		'# Title\n\nplain *bold* and <Amy@registrar> text\n\n- one\n- two\n\n"quoted"'
	);
	for (const block of Array.from(root.children)) {
		for (const line of block.querySelectorAll('li, p').length
			? Array.from(block.querySelectorAll('li, p'))
			: [block]) {
			for (let offset = 0; offset <= lengthOf(line); offset++) {
				const { node, offset: within } = nodeAt(line, offset);
				expect(offsetOf(line, node, within)).toBe(offset);
			}
		}
	}
});
