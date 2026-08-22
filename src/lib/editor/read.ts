import Bullets from '../../markup/Bullets';
import Characters from '../../markup/Text';
import Heading from '../../markup/Heading';
import Link from '../../markup/Link';
import Markup from '../../markup/Markup';
import Numbered from '../../markup/Numbered';
import Paragraph from '../../markup/Paragraph';
import Quote from '../../markup/Quote';
import Reference from '../../markup/Reference';
import type Block from '../../markup/Block';
import type Segment from '../../markup/Segment';
import { serializeBlock } from '../../markup/serializer';
import { PillAttribute } from './render';

/**
 * Read the DOM back into markup.
 *
 * The browser is the one editing, so this has to cope with what browsers produce as well as what
 * the renderer produces: <b> where we wrote <strong>, text nodes split in three by a keystroke,
 * a stray <span style> from a paste. Everything it doesn't recognize contributes its text and
 * nothing else, so unsupported formatting is dropped rather than smuggled through to be lost at
 * save time.
 *
 * The AST it produces goes through the same serializer as everything else, so there is exactly one
 * implementation of escaping.
 */

type Format = '' | '*' | '_';

function isElement(node: Node): node is Element {
	return node.nodeType === 1;
}

function readInline(node: Node, format: Format, into: Segment[]) {
	if (node.nodeType === 3) {
		// Browsers substitute a non-breaking space wherever an ordinary one would collapse. Nobody
		// typed those, and the grammar cannot tell them apart from the ones people do type.
		const text = (node as globalThis.Text).data.replace(/\u00a0/g, ' ');
		if (text !== '') into.push(new Characters(format, text));
		return;
	}
	if (!isElement(node)) return;

	const pill = node.getAttribute(PillAttribute);
	if (pill !== null) {
		const text = node.textContent ?? '';
		const target = node.getAttribute('data-target') ?? '';
		into.push(pill === 'reference' ? new Reference(text, target) : new Link(text, target));
		return;
	}

	const tag = node.tagName.toLowerCase();
	// The grammar has no line break within a block, so one contributes nothing.
	if (tag === 'br') return;

	// A bold or italic run is one segment, however many text nodes typing has split it into, and
	// whatever is nested inside it. Bold and italic cannot combine in this grammar, so the outer
	// one wins rather than the inner silently replacing it.
	const marked = tag === 'strong' || tag === 'b' ? '*' : tag === 'em' || tag === 'i' ? '_' : '';
	if (marked !== '' && format === '') {
		const text = node.textContent ?? '';
		if (text !== '') into.push(new Characters(marked, text));
		return;
	}

	for (const child of Array.from(node.childNodes)) readInline(child, format, into);
}

/**
 * Typing splits a text node in three, so unformatted runs have to be put back together. Formatted
 * runs are left alone: two adjacent bold elements really are two segments, and merging them would
 * quietly rewrite `*a**b*` as `*ab*`.
 */
function coalesce(segments: Segment[]): Segment[] {
	const result: Segment[] = [];
	for (const segment of segments) {
		const previous = result[result.length - 1];
		if (
			segment instanceof Characters &&
			previous instanceof Characters &&
			previous.format === '' &&
			segment.format === ''
		)
			result[result.length - 1] = new Characters(previous.format, previous.text + segment.text);
		else result.push(segment);
	}
	return result;
}

function readLine(element: Element): Segment[] {
	const segments: Segment[] = [];
	for (const child of Array.from(element.childNodes)) readInline(child, '', segments);
	return coalesce(segments);
}

/** The elements holding each line of a block: list items, quoted lines, or the block itself. */
export function lines(element: Element): Element[] {
	const tag = element.tagName.toLowerCase();
	if (tag === 'ul' || tag === 'ol')
		return Array.from(element.children).filter((c) => c.tagName.toLowerCase() === 'li');
	if (tag === 'blockquote') {
		const children = Array.from(element.children);
		return children.length > 0 ? children : [element];
	}
	return [element];
}

export function readBlock(element: Element): Block {
	const tag = element.tagName.toLowerCase();
	if (tag === 'ul') return new Bullets(lines(element).map(readLine));
	if (tag === 'ol') return new Numbered(lines(element).map(readLine));
	if (tag === 'blockquote') return new Quote(lines(element).map(readLine));
	if (tag === 'h1' || tag === 'h2' || tag === 'h3') return new Heading(1, readLine(element));
	if (tag === 'h4' || tag === 'h5' || tag === 'h6') return new Heading(2, readLine(element));
	return new Paragraph(readLine(element));
}

/** The source for one block, ready to be spliced back into the rest of the document. */
export function readBlockSource(element: Element): string {
	return serializeBlock(readBlock(element));
}

export function readDocument(root: Element): Markup {
	return new Markup(Array.from(root.children).map(readBlock));
}
