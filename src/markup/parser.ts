import type Block from './Block';
import Bullets from './Bullets';
import Characters from './Text';
import Link from './Link';
import Markup from './Markup';
import Numbered from './Numbered';
import Paragraph from './Paragraph';
import type Segment from './Segment';

export function parse(markup: string): Markup {
	const lines = markup.split('\n\n').map((line) => line.trim());

	return new Markup(lines.map((line) => parseBlock(line)));
}

export function parseBlock(line: string): Block {
	return line.startsWith('* ')
		? parseBullets(line)
		: /^[0-9]+\./.test(line)
		? parseNumbers(line)
		: parseParagraph(line);
}

export function parseParagraph(line: string): Paragraph {
	return new Paragraph(parseSegments(line));
}

export function parseBullets(line: string): Bullets {
	return new Bullets(
		line
			.split('* ')
			.slice(1)
			.map((line) => parseSegments(line.trim()))
	);
}

export function parseNumbers(line: string): Bullets {
	return new Numbered(
		line
			.split(/[0-9]+. /)
			.slice(1)
			.map((line) => parseSegments(line.trim()))
	);
}

export function parseSegments(line: string): Segment[] {
	const segments: Segment[] = [];
	// Accumlate characters
	let characters = '';

	// Keep going until there are no more characters.
	while (line.length > 0) {
		// Get the next character.
		const next = line.charAt(0);
		// Remove the character.
		line = line.substring(1);

		// Is it a bold or italic?
		if (next === '*' || next === '_') {
			// Save what's accumlated.
			if (characters.length > 0) {
				segments.push(new Characters('', characters));
				characters = '';
			}
			// Get the end of the bold/italic.
			const end = line.indexOf(next);
			const index = end < 0 ? line.length : end;
			// Create characters with a format.
			segments.push(new Characters(next, line.substring(0, index)));
			// Move to after the format.
			line = line.substring(index + 1);
		} else if (next === '<') {
			// Save what's accumulated.
			if (characters.length > 0) {
				segments.push(new Characters('', characters));
				characters = '';
			}
			// Find the closing angle.
			const end = line.indexOf('>');
			const index = end < 0 ? line.length : end;
			// Get the link chunk
			const chunk = line.substring(0, index);
			// Split it by the separator
			const [label, url] = chunk.split('@');
			// Move to after the end of the link
			line = line.substring(index + 1);
			// Add a new link.
			segments.push(new Link(label ?? '', url ?? ''));
		} // Add to accumulator.
		else characters = characters + next;
	}

	// Save whatever we accumlated, if anything.
	if (characters.length > 0) segments.push(new Characters('', characters));

	return segments;
}
