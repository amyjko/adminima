import Bullets from './Bullets';
import Characters from './Text';
import Heading from './Heading';
import Link from './Link';
import type Markup from './Markup';
import Numbered from './Numbered';
import Paragraph from './Paragraph';
import Quote from './Quote';
import Reference from './Reference';
import type Block from './Block';
import type Segment from './Segment';

const EmailRegex =
	/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g;

/**
 * Escape the characters that would otherwise start something in running text. Everything else —
 * periods, hyphens, quotation marks mid-sentence — is left alone, so that the source stays
 * readable for the people who prefer to write it directly.
 */
function escapeText(text: string): string {
	let result = text.replace(/[\\*_<]/g, (character) => `\\${character}`);
	// Escape the @ of anything that would otherwise be auto-linked as an email address.
	result = result.replace(EmailRegex, (email) => email.replace('@', '\\@'));
	return result;
}

/** Inside a link, the separator and the closing angle are what need escaping. */
function escapeLink(text: string): string {
	return text.replace(/[\\>@]/g, (character) => `\\${character}`);
}

function serializeSegment(segment: Segment, first = false): string {
	if (segment instanceof Characters) {
		if (segment.format === '') return escapeText(segment.text);
		/*
		 * Whitespace just inside a formatting run stays exactly where it was written, with one
		 * exception: a bold run that opens a line with a space reads as a bullet, since `* ` is one.
		 * That space is moved outside, where the line trim takes it — but it was a leading space at
		 * the start of a line, which the trim would have taken either way.
		 *
		 * Everything else is left alone. Moving trailing whitespace out put it at the end of a
		 * line, where the trim ate it: `_Overview _` became `_Overview_ ` became `_Overview_`, and
		 * a space somebody typed was gone. Real documents are full of that shape.
		 */
		if (segment.text.trim() === '')
			return segment.text === '' ? `${segment.format}${segment.format}` : segment.text;
		const ambiguous = first && segment.format === '*' && /^\s/.test(segment.text);
		if (!ambiguous) return `${segment.format}${escapeText(segment.text)}${segment.format}`;
		const trimmed = segment.text.replace(/^\s+/, '');
		const before = segment.text.slice(0, segment.text.length - trimmed.length);
		return `${before}${segment.format}${escapeText(trimmed)}${segment.format}`;
	} else if (segment instanceof Link) {
		return `<${escapeLink(segment.text)}@${escapeLink(segment.url)}>`;
	} else if (segment instanceof Reference) {
		return `<${escapeLink(segment.text)}@${escapeLink(segment.target)}>`;
	} else return '';
}

/** An email address the parser auto-linked, rather than one someone wrote out as a link. */
function isAutoLink(segment: Segment): segment is Link {
	return segment instanceof Link && segment.url === `mailto:${segment.text}`;
}

/** The last character of what precedes an email, if it could be read as part of the address. */
const EmailLocalEnd = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]$/;
/** The first character of what follows an email, if it could be read as part of the domain. */
const EmailDomainStart = /^[a-zA-Z0-9.-]/;

function serializeSegments(segments: Segment[]): string {
	// Serialize everything once, writing auto-linked emails bare, so that each one can see what
	// its neighbors look like before deciding whether writing it bare is safe.
	const parts = segments.map((segment, index) =>
		isAutoLink(segment) ? segment.text : serializeSegment(segment, index === 0)
	);

	let result = '';
	for (let index = 0; index < segments.length; index++) {
		const segment = segments[index];
		if (isAutoLink(segment)) {
			// A bare address would swallow an adjacent word — `words` before `someone@example.com`
			// reparses as one long address — so fall back to explicit link syntax when either side
			// could be mistaken for part of it.
			const after = parts[index + 1] ?? '';
			const safe = !EmailLocalEnd.test(result) && (after === '' || !EmailDomainStart.test(after));
			result += safe ? segment.text : `<${escapeLink(segment.text)}@${escapeLink(segment.url)}>`;
		} else result += parts[index];
	}
	return result;
}

/**
 * Keep a paragraph from being read back as some other kind of block. A backslash here is enough:
 * none of the block prefixes match a line that starts with one.
 */
function escapeParagraph(line: string): string {
	if (line.startsWith('#') || line.startsWith('"') || line.startsWith('• ')) return `\\${line}`;
	if (line.startsWith('- ')) return `\\${line}`;
	// A numbered prefix is escaped at its period, since a leading digit isn't what triggers it.
	const numbered = /^([0-9]+)\./.exec(line);
	if (numbered) return `${numbered[1]}\\${line.slice(numbered[1].length)}`;
	return line;
}

export function serializeBlock(block: Block): string {
	if (block instanceof Paragraph) return escapeParagraph(serializeSegments(block.segments));
	else if (block instanceof Heading)
		return `${'#'.repeat(block.level)} ${serializeSegments(block.text)}`;
	else if (block instanceof Bullets)
		return block.items.map((item) => `- ${serializeSegments(item)}`).join('\n');
	else if (block instanceof Numbered)
		return block.items.map((item, index) => `${index + 1}. ${serializeSegments(item)}`).join('\n');
	else if (block instanceof Quote)
		return block.blocks.map((line) => `"${serializeSegments(line)}"`).join('\n');
	else return '';
}

/** Render markup back to source. `parse(serialize(m))` is `m`, for anything the parser can produce. */
export function serialize(markup: Markup): string {
	return markup.blocks.map(serializeBlock).join('\n\n');
}
