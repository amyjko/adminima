import type Block from './Block';
import Bullets from './Bullets';
import Characters from './Text';
import Link from './Link';
import Markup from './Markup';
import Numbered from './Numbered';
import Paragraph from './Paragraph';
import type Segment from './Segment';
import Heading from './Heading';
import Quote from './Quote';

const BulletPrefixes = ['* ', '• ', '- '];
const EmailRegex =
	/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/;

function isBullets(line: string): boolean {
	return BulletPrefixes.some((b) => line.startsWith(b));
}

export function parse(markup: string): Markup {
	const lines = markup
		.split('\n')
		.filter((l) => l.trim() !== '')
		.map((line) => line.trim());

	const blocks: Block[] = [];
	let index = 0;
	while (index < lines.length) {
		const line = lines[index];
		if (line.startsWith('"') && line.endsWith('"')) {
			blocks.push(new Quote(parseSegments(line.slice(1, -1))));
			index++;
		} else if (isBullets(line)) {
			const bulletLines = [];
			while (index < lines.length && isBullets(lines[index])) {
				bulletLines.push(parseSegments(lines[index].slice(2)));
				index++;
			}
			blocks.push(new Bullets(bulletLines));
		} else if (/^[0-9]+\./.test(line)) {
			const numberedLines = [];
			while (index < lines.length && /^[0-9]+\./.test(lines[index])) {
				numberedLines.push(parseSegments(lines[index].slice(lines[index].indexOf('.') + 1).trim()));
				index++;
			}
			blocks.push(new Numbered(numberedLines));
		} else if (line.startsWith('#')) {
			let count = 0;
			while (count < line.length && line.charAt(count) === '#') count++;
			blocks.push(new Heading(count === 1 ? 1 : 2, parseSegments(line.slice(count))));
			index++;
		} else {
			blocks.push(new Paragraph(parseSegments(line)));
			index++;
		}
	}

	return new Markup(blocks);
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
		} else if (EmailRegex.test(next + line)) {
			// Save what's accumulated.
			if (characters.length > 0) {
				segments.push(new Characters('', characters));
				characters = '';
			}
			// Get the match
			const match = EmailRegex.exec(next + line);

			if (match) {
				const email = match[0];
				const index = email.length;

				// Move to after the end of the link
				line = line.substring(index - 1);
				// Add a new link.
				segments.push(new Link(email, `mailto:${email}`));
			} else characters = characters + next;
		}
		// Add to accumulator if none of the above matched.
		else characters = characters + next;
	}

	// Save whatever we accumlated, if anything.
	if (characters.length > 0) segments.push(new Characters('', characters));

	return segments;
}
