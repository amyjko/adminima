import type Block from './Block';
import Bullets from './Bullets';
import Characters from './Text';
import Link from './Link';
import Markup from './Markup';
import Numbered from './Numbered';
import Paragraph from './Paragraph';
import type Part from './Part';
import type Segment from './Segment';
import Heading from './Heading';
import Quote from './Quote';
import Reference from './Reference';

export const BulletPrefixes = ['* ', '• ', '- '];

/**
 * The characters a backslash can escape. A backslash before anything else — `C:\shared`, or a `\d`
 * in a regular expression — stays a literal backslash, so that existing text keeps its meaning.
 */
export const Escapable = new Set(['\\', '*', '_', '<', '>', '@', '#', '"', '-', '•', '.']);

const EmailRegex =
	/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/;

const NumberedRegex = /^[0-9]+\./;

/** A bare domain, so that `<home@adminima.app>` stays a link rather than becoming a reference. */
const DomainRegex = /^[\w-]+(\.[\w-]+)+([/?#]|$)/;

function isBullets(line: string): boolean {
	return BulletPrefixes.some((b) => line.startsWith(b));
}

/** Whether a link's target is a web address rather than a reference to a role or process. */
function isURL(target: string): boolean {
	return (
		target.startsWith('http://') ||
		target.startsWith('https://') ||
		target.startsWith('/') ||
		target.startsWith('mailto:') ||
		DomainRegex.test(target) ||
		EmailRegex.test(target)
	);
}

/** Find the next occurrence of a character, skipping over any that are escaped. */
function findUnescaped(text: string, from: number, character: string): number {
	for (let index = from; index < text.length; index++) {
		const next = text.charAt(index);
		if (next === '\\' && index + 1 < text.length && Escapable.has(text.charAt(index + 1))) index++;
		else if (next === character) return index;
	}
	return -1;
}

/** Resolve escape sequences into the characters they stand for. */
function unescape(text: string): string {
	let result = '';
	for (let index = 0; index < text.length; index++) {
		const next = text.charAt(index);
		if (next === '\\' && index + 1 < text.length && Escapable.has(text.charAt(index + 1))) {
			result += text.charAt(index + 1);
			index++;
		} else result += next;
	}
	return result;
}

/** A non-blank line of source, with the offset at which its trimmed text begins. */
type Line = { text: string; start: number };

function split(markup: string): Line[] {
	const lines: Line[] = [];
	let offset = 0;
	for (const raw of markup.split('\n')) {
		const text = raw.trim();
		if (text !== '') lines.push({ text, start: offset + raw.indexOf(text) });
		// Account for the newline that split() removed.
		offset += raw.length + 1;
	}
	return lines;
}

/**
 * Parse blocks, optionally recording the span of source each block came from. Spans are what let
 * the editor rewrite only the blocks someone actually edited, leaving the rest of the source
 * byte for byte as they wrote it.
 */
function parseBlocks(lines: Line[], spans?: Map<Part, [number, number]>): Block[] {
	const blocks: Block[] = [];
	let index = 0;

	function remember(block: Block, first: number, last: number) {
		if (spans) spans.set(block, [lines[first].start, lines[last].start + lines[last].text.length]);
		blocks.push(block);
	}

	while (index < lines.length) {
		const line = lines[index].text;
		const first = index;
		if (line.startsWith('"')) {
			const segmentList: Segment[][] = [];
			do {
				// Parse the current line, not the line the loop started on, or every line of a
				// multi-line quote is a copy of the first.
				segmentList.push(parseSegments(unquote(lines[index].text)));
				index++;
			} while (index < lines.length && lines[index].text.startsWith('"'));
			// No extra index++ here: the loop above already advanced past the last quoted line, and
			// skipping again would swallow whatever block follows the quote.
			remember(new Quote(segmentList), first, index - 1);
		} else if (isBullets(line)) {
			const items: Segment[][] = [];
			while (index < lines.length && isBullets(lines[index].text)) {
				items.push(parseSegments(lines[index].text.slice(2)));
				index++;
			}
			remember(new Bullets(items), first, index - 1);
		} else if (NumberedRegex.test(line)) {
			const items: Segment[][] = [];
			while (index < lines.length && NumberedRegex.test(lines[index].text)) {
				const text = lines[index].text;
				items.push(parseSegments(text.slice(text.indexOf('.') + 1).trim()));
				index++;
			}
			remember(new Numbered(items), first, index - 1);
		} else if (line.startsWith('#')) {
			let count = 0;
			while (count < line.length && line.charAt(count) === '#') count++;
			remember(
				new Heading(count === 1 ? 1 : 2, parseSegments(line.slice(count).trim())),
				first,
				first
			);
			index++;
		} else {
			remember(new Paragraph(parseSegments(line)), first, first);
			index++;
		}
	}

	return blocks;
}

/**
 * Strip the quotation marks around a quoted line. The closing mark is optional: taking it off
 * unconditionally used to eat the last character of a quote that was never closed.
 */
function unquote(line: string): string {
	const inner = line.slice(1);
	return inner.endsWith('"') ? inner.slice(0, -1) : inner;
}

export function parse(markup: string): Markup {
	return new Markup(parseBlocks(split(markup)));
}

/** Parse, additionally recording where in the source each block came from. */
export function parseWithSpans(markup: string): {
	markup: Markup;
	spans: Map<Part, [number, number]>;
} {
	const spans = new Map<Part, [number, number]>();
	return { markup: new Markup(parseBlocks(split(markup), spans)), spans };
}

export function parseSegments(line: string): Segment[] {
	const segments: Segment[] = [];
	// Accumulate characters that aren't part of anything else.
	let characters = '';
	let index = 0;

	function flush() {
		if (characters.length > 0) {
			segments.push(new Characters('', characters));
			characters = '';
		}
	}

	while (index < line.length) {
		const next = line.charAt(index);

		// Is it an escape? Take the character that follows literally.
		if (next === '\\' && index + 1 < line.length && Escapable.has(line.charAt(index + 1))) {
			characters += line.charAt(index + 1);
			index += 2;
		}
		// Is it a bold or italic?
		else if (next === '*' || next === '_') {
			flush();
			const end = findUnescaped(line, index + 1, next);
			const stop = end < 0 ? line.length : end;
			segments.push(new Characters(next, unescape(line.substring(index + 1, stop))));
			index = stop + 1;
		}
		// Is it a link or a reference?
		else if (next === '<') {
			flush();
			const end = findUnescaped(line, index + 1, '>');
			const stop = end < 0 ? line.length : end;
			const chunk = line.substring(index + 1, stop);
			// Split on the first unescaped separator and keep everything after it as the target, so
			// that a URL containing an @ — a mailto:, most of all — survives.
			const at = findUnescaped(chunk, 0, '@');
			const text = unescape(at < 0 ? chunk : chunk.substring(0, at));
			const target = at < 0 ? '' : unescape(chunk.substring(at + 1));
			segments.push(isURL(target) ? new Link(text, target) : new Reference(text, target));
			index = stop + 1;
		}
		// Is it a bare email address?
		else if (EmailRegex.test(line.substring(index))) {
			const match = EmailRegex.exec(line.substring(index));
			if (match) {
				flush();
				segments.push(new Link(match[0], `mailto:${match[0]}`));
				index += match[0].length;
			} else {
				characters += next;
				index++;
			}
		}
		// None of the above, so it's just a character.
		else {
			characters += next;
			index++;
		}
	}

	flush();

	return segments;
}
