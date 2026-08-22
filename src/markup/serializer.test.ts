import { test, expect } from 'vitest';
import { parse } from './parser';
import { serialize } from './serializer';

// Parsing and reserializing normalizes source into a canonical form. Everything here is that form.
test.each([
	// Ordinary text is left alone.
	['test', 'test'],
	['I am *bold*', 'I am *bold*'],
	['I am _italic_', 'I am _italic_'],
	['# Heading', '# Heading'],
	['## Subheading', '## Subheading'],
	['"A quote"', '"A quote"'],
	['<label@https://example.com>', '<label@https://example.com>'],
	['<Amy@registrar>', '<Amy@registrar>'],
	['Write to someone@example.com today', 'Write to someone@example.com today'],
	// Bullets normalize to a single marker, and numbers are renumbered from one.
	['* a\n* b', '- a\n- b'],
	['• a\n• b', '- a\n- b'],
	['5. a\n6. b', '1. a\n2. b'],
	// Blank lines between blocks normalize to exactly one.
	['a\n\n\n\nb', 'a\n\nb'],
	['a\nb', 'a\n\nb'],
	// Deeper headings collapse, because the grammar only has two levels.
	['#### Deep', '## Deep'],
	// Unterminated formatting is closed, which is the one place reserializing rewrites what was typed.
	['I am *bold', 'I am *bold*'],
	// A space just inside the end of a formatting run stays put. Moving it out would put it at the
	// end of a line, where parsing trims it away and somebody's space is gone.
	['_Overview _', '_Overview _'],
	['*Heading *', '*Heading *'],
	['a *bold * word', 'a *bold * word'],
	// A space just inside the start stays too, unless it would open a line as a bullet.
	['_ Rationale_', '_ Rationale_'],
	['a _ spaced_ word', 'a _ spaced_ word'],
	// Characters that would otherwise start something are escaped.
	['\\*not bold\\*', '\\*not bold\\*'],
	['a \\< b', 'a \\< b'],
	// A backslash before an ordinary character stays a literal backslash, so paths survive.
	['C:\\shared', 'C:\\\\shared'],
	['match \\d+ digits', 'match \\\\d+ digits'],
	// A paragraph that looks like another kind of block is escaped so it stays a paragraph.
	['\\- not a list', '\\- not a list'],
	['1\\. not a list', '1\\. not a list'],
	['\\# not a heading', '\\# not a heading'],
	['\\"not a quote', '\\"not a quote'],
	// A URL containing the separator is kept whole.
	['<mail@mailto:someone@example.com>', '<mail@mailto:someone\\@example.com>'],
	// A quote that was never closed keeps its last character.
	['"unclosed', '"unclosed"']
])('serialize %s', (markup: string, expected: string) => {
	expect(serialize(parse(markup))).toBe(expected);
});

test('serializing is stable across repeated edits', () => {
	const once = serialize(parse('# Title\n\n- one\n- two\n\n"quoted"\n\nplain *bold* text'));
	expect(serialize(parse(once))).toBe(once);
});
