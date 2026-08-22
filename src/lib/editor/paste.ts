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
import { coalesce } from './segments';
import { parse } from '../../markup/parser';
import { PillAttribute } from './render';

/**
 * Turning what is on the clipboard into markup.
 *
 * Pasting rich text from somewhere else is the main way content that the grammar cannot express
 * gets in. Everything unrepresentable is flattened here, on the way in, where the person can see
 * what they got and undo it — rather than being carried along in the DOM and quietly lost at save
 * time, which is the version that loses someone's work.
 */

/** Elements that carry no content anyone meant to paste. */
const Ignored = new Set(['img', 'style', 'script', 'head', 'meta', 'link', 'noscript', 'svg']);

/** A link back into this application, which is worth keeping as a reference rather than a URL. */
const RoleOrProcess = /\/org\/[^/]+\/(role|process)\/([^/?#]+)/;

function referenceFor(href: string, origin: string | undefined): Reference | undefined {
	let path = href;
	if (/^https?:\/\//.test(href)) {
		try {
			const url = new URL(href);
			if (origin !== undefined && url.origin !== origin) return undefined;
			path = url.pathname;
		} catch {
			return undefined;
		}
	}
	const match = RoleOrProcess.exec(path);
	return match ? new Reference('', decodeURIComponent(match[2])) : undefined;
}

function inlineFrom(
	node: Node,
	format: '' | '*' | '_',
	into: Segment[],
	origin: string | undefined
) {
	if (node.nodeType === 3) {
		// Whitespace in HTML is mostly layout, not content.
		const text = (node as globalThis.Text).data.replace(/\s+/g, ' ');
		if (text !== '') into.push(new Characters(format, text));
		return;
	}
	if (node.nodeType !== 1) return;
	const element = node as Element;
	const tag = element.tagName.toLowerCase();

	if (tag === 'br') return;
	if (Ignored.has(tag)) return;

	// Content copied out of the editor arrives as the editor's own HTML, since across blocks the
	// clipboard is the browser's to write. Without this, copying a paragraph turns every reference
	// in it into plain words.
	const pill = element.getAttribute(PillAttribute);
	if (pill !== null) {
		const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
		const target = element.getAttribute('data-target') ?? '';
		if (text !== '')
			into.push(pill === 'reference' ? new Reference(text, target) : new Link(text, target));
		return;
	}
	// A nested list is collected as items in its own right, so it must not also be read as part of
	// the text of the item containing it.
	if (tag === 'ul' || tag === 'ol') return;

	if (tag === 'a') {
		const href = element.getAttribute('href') ?? '';
		const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
		if (text === '') return;
		const reference = referenceFor(href, origin);
		if (reference !== undefined) into.push(new Reference(text, reference.target));
		else if (href !== '') into.push(new Link(text, href));
		else into.push(new Characters(format, text));
		return;
	}

	// Bold and italic cannot combine, so the outer one wins.
	const marked =
		tag === 'strong' || tag === 'b' || tag === 'th' ? '*' : tag === 'em' || tag === 'i' ? '_' : '';
	const inner = format === '' ? marked : format;
	for (const child of Array.from(element.childNodes)) inlineFrom(child, inner, into, origin);
}

function lineFrom(element: Element, origin: string | undefined): Segment[] {
	const segments: Segment[] = [];
	for (const child of Array.from(element.childNodes)) inlineFrom(child, '', segments, origin);
	return trim(coalesce(segments));
}

/** Drop the layout whitespace at either end of a line, which HTML has a great deal of. */
function trim(segments: Segment[]): Segment[] {
	const result = [...segments];
	const first = result[0];
	if (first instanceof Characters)
		result[0] = new Characters(first.format, first.text.replace(/^\s+/, ''));
	const last = result[result.length - 1];
	if (last instanceof Characters)
		result[result.length - 1] = new Characters(last.format, last.text.replace(/\s+$/, ''));
	return coalesce(result);
}

const BlockTags = new Set([
	'p',
	'div',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'ul',
	'ol',
	'blockquote',
	'li',
	'table',
	'tr',
	'section',
	'article',
	'pre'
]);

function hasBlocks(element: Element): boolean {
	return Array.from(element.children).some((child) => BlockTags.has(child.tagName.toLowerCase()));
}

function blocksFrom(element: Element, into: Block[], origin: string | undefined) {
	const tag = element.tagName.toLowerCase();
	if (Ignored.has(tag)) return;

	if (tag === 'ul' || tag === 'ol') {
		// The grammar has no nested lists, so every item at every depth becomes one item. Faking the
		// indentation with spaces would only produce markup that no longer means a list.
		const items = Array.from(element.querySelectorAll('li')).map((li) => lineFrom(li, origin));
		const filled = items.filter((item) => item.length > 0);
		if (filled.length > 0) into.push(tag === 'ul' ? new Bullets(filled) : new Numbered(filled));
		return;
	}

	if (tag === 'blockquote') {
		const lines = hasBlocks(element)
			? Array.from(element.children).map((child) => lineFrom(child, origin))
			: [lineFrom(element, origin)];
		const filled = lines.filter((line) => line.length > 0);
		if (filled.length > 0) into.push(new Quote(filled));
		return;
	}

	if (/^h[1-6]$/.test(tag)) {
		const line = lineFrom(element, origin);
		// Only the top level survives as a level one heading; the grammar has two.
		if (line.length > 0) into.push(new Heading(tag === 'h1' ? 1 : 2, line));
		return;
	}

	if (tag === 'table') {
		// A table cannot be expressed, so each row becomes a line rather than vanishing.
		for (const row of Array.from(element.querySelectorAll('tr'))) {
			const cells = Array.from(row.children).map((cell) => lineFrom(cell, origin));
			const line = coalesce(
				cells
					.filter((c) => c.length > 0)
					.flatMap((c, index) => (index === 0 ? c : [new Characters('', ' — '), ...c]))
			);
			if (line.length > 0) into.push(new Paragraph(line));
		}
		return;
	}

	// A container of blocks contributes its blocks; anything else is a paragraph of its own.
	if (hasBlocks(element)) {
		for (const child of Array.from(element.children)) blocksFrom(child, into, origin);
		return;
	}

	const line = lineFrom(element, origin);
	if (line.length > 0) into.push(new Paragraph(line));
}

/** What was on the clipboard as HTML, reduced to what the grammar can say. */
export function markupFromHTML(html: string, document: Document, origin?: string): Markup {
	const container = document.createElement('div');
	container.innerHTML = html;
	const blocks: Block[] = [];
	if (hasBlocks(container))
		for (const child of Array.from(container.children)) blocksFrom(child, blocks, origin);
	else {
		const line = lineFrom(container, origin);
		if (line.length > 0) blocks.push(new Paragraph(line));
	}
	return new Markup(blocks);
}

/**
 * Plain text is read as markup source rather than as literal characters. In a product whose
 * documents are markup, pasting a list should give a list, and it keeps copying between the rich
 * and the source view coherent.
 */
export function markupFromText(text: string): Markup {
	return parse(text);
}
