import Bullets from '../../markup/Bullets';
import Characters from '../../markup/Text';
import Heading from '../../markup/Heading';
import Link from '../../markup/Link';
import type Markup from '../../markup/Markup';
import Numbered from '../../markup/Numbered';
import Paragraph from '../../markup/Paragraph';
import Quote from '../../markup/Quote';
import Reference from '../../markup/Reference';
import type Block from '../../markup/Block';
import type Segment from '../../markup/Segment';

/**
 * Build the DOM the editor edits.
 *
 * This is deliberately not the Svelte components that render markup for reading. Svelte's
 * reconciler cannot own DOM that the browser is also mutating: the moment an each block reruns
 * over the paragraph someone is typing in, their cursor is gone. So the editor renders
 * imperatively, once, and then leaves the browser to it.
 *
 * The two renderers are kept honest by a round trip rather than by comparing their HTML — see
 * render.test.ts. What has to match is the markup that comes back out, not the tags.
 */

/** Blocks are marked so that a DOM selection can be traced back to the block it sits in. */
export const BlockAttribute = 'data-block';

/** Links and references are single objects, not editable text, and are marked so. */
export const PillAttribute = 'data-pill';

function pill(document: Document, kind: 'link' | 'reference', text: string, target: string) {
	const element = document.createElement('span');
	element.setAttribute(PillAttribute, kind);
	element.setAttribute('data-target', target);
	// The browser gives a node that isn't editable a single step of caret travel and deletes it
	// whole, which is exactly how a reference should behave.
	element.setAttribute('contenteditable', 'false');
	element.className = 'pill';
	element.textContent = text;
	return element;
}

function renderSegment(document: Document, segment: Segment): Node {
	if (segment instanceof Characters) {
		if (segment.format === '') return document.createTextNode(segment.text);
		const element = document.createElement(segment.format === '*' ? 'strong' : 'em');
		element.textContent = segment.text;
		return element;
	} else if (segment instanceof Link) return pill(document, 'link', segment.text, segment.url);
	else if (segment instanceof Reference)
		return pill(document, 'reference', segment.text, segment.target);
	else return document.createTextNode('');
}

/**
 * Fill a line with its segments. Empty text nodes on either side of a pill are what let WebKit put
 * a caret next to one at the start or end of a line; they are invisible to textContent, and so to
 * everything that counts characters.
 */
function renderLine(document: Document, element: Element, segments: Segment[]) {
	if (segments.length === 0) {
		// A line with nothing in it has no height and cannot be clicked into without this.
		element.appendChild(document.createElement('br'));
		return;
	}
	for (const segment of segments) {
		const node = renderSegment(document, segment);
		if (node.nodeType === 1 && (node as Element).hasAttribute(PillAttribute))
			element.appendChild(document.createTextNode(''));
		element.appendChild(node);
		if (node.nodeType === 1 && (node as Element).hasAttribute(PillAttribute))
			element.appendChild(document.createTextNode(''));
	}
}

function renderLines(document: Document, parent: Element, tag: string, lines: Segment[][]) {
	for (const segments of lines) {
		const line = document.createElement(tag);
		renderLine(document, line, segments);
		parent.appendChild(line);
	}
}

export function renderBlock(document: Document, block: Block, id: string): HTMLElement {
	let element: HTMLElement;
	if (block instanceof Heading) {
		element = document.createElement(block.level === 1 ? 'h3' : 'h4');
		renderLine(document, element, block.text);
	} else if (block instanceof Bullets) {
		element = document.createElement('ul');
		renderLines(document, element, 'li', block.items);
	} else if (block instanceof Numbered) {
		element = document.createElement('ol');
		renderLines(document, element, 'li', block.items);
	} else if (block instanceof Quote) {
		element = document.createElement('blockquote');
		renderLines(document, element, 'p', block.blocks);
	} else {
		element = document.createElement('p');
		renderLine(document, element, block instanceof Paragraph ? block.segments : []);
	}
	element.setAttribute(BlockAttribute, id);
	return element;
}

/** Render a whole document, numbering the blocks so that each one can be found again. */
export function renderMarkup(
	document: Document,
	markup: Markup,
	next: () => string
): DocumentFragment {
	const fragment = document.createDocumentFragment();
	for (const block of markup.blocks) fragment.appendChild(renderBlock(document, block, next()));
	return fragment;
}
