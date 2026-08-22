import { test, expect } from 'vitest';
import { parse } from './parser';

test.each([
	['test', 'Markup[Paragraph[Text[test]]]'],
	['I am *bold*', 'Markup[Paragraph[Text[I am ], Text[*bold*]]]'],
	['I am *bold', 'Markup[Paragraph[Text[I am ], Text[*bold*]]]'],
	['I am _italic_', 'Markup[Paragraph[Text[I am ], Text[_italic_]]]'],
	['I am _italic', 'Markup[Paragraph[Text[I am ], Text[_italic_]]]'],
	['I am _*bold* italic_', 'Markup[Paragraph[Text[I am ], Text[_*bold* italic_]]]'],
	[
		'I am a <link@adminima.app> to visit',
		'Markup[Paragraph[Text[I am a ], Link[link@adminima.app], Text[ to visit]]]'
	],
	[
		'I am: \n\n* bullet 1\n* bullet 2\n* bullet 3\n\nThen another paragraph.',
		'Markup[Paragraph[Text[I am:]], Bullets[Text[bullet 1], Text[bullet 2], Text[bullet 3]], Paragraph[Text[Then another paragraph.]]]'
	],
	[
		'I am: \n\n- bullet 1\n- bullet 2\n- bullet 3\n\nThen another paragraph.',
		'Markup[Paragraph[Text[I am:]], Bullets[Text[bullet 1], Text[bullet 2], Text[bullet 3]], Paragraph[Text[Then another paragraph.]]]'
	],
	[
		'I am: \n\n• bullet 1\n• bullet 2\n• bullet 3\n\nThen another paragraph.',
		'Markup[Paragraph[Text[I am:]], Bullets[Text[bullet 1], Text[bullet 2], Text[bullet 3]], Paragraph[Text[Then another paragraph.]]]'
	],
	[
		'I am: \n\n1. bullet 1\n2. bullet 2\n3. bullet 3\n\nThen another paragraph.',
		'Markup[Paragraph[Text[I am:]], Numbered[Text[bullet 1], Text[bullet 2], Text[bullet 3]], Paragraph[Text[Then another paragraph.]]]'
	],
	[
		'I am a paragraph\n\n"I am a block quote"\n\nThen another paragraph.',
		'Markup[Paragraph[Text[I am a paragraph]], Quote[Text[I am a block quote]], Paragraph[Text[Then another paragraph.]]]'
	],
	// Each line of a multi-line quote is its own line; the parser used to repeat the first one.
	[
		'"first quoted line"\n"second quoted line"',
		'Markup[Quote[Text[first quoted line], Text[second quoted line]]]'
	],
	// A quote at the very end must not run past the end of the input.
	[
		'A paragraph.\n\n"A trailing quote"',
		'Markup[Paragraph[Text[A paragraph.]], Quote[Text[A trailing quote]]]'
	],
	// Headings drop the space after the hashes rather than keeping it in the text.
	['# Hello', 'Markup[Header[# Text[Hello]]]'],
	['## Hello', 'Markup[Header[## Text[Hello]]]'],
	// A backslash escapes a character that would otherwise start something.
	['\\*not bold\\*', 'Markup[Paragraph[Text[*not bold*]]]'],
	['a \\< b', 'Markup[Paragraph[Text[a < b]]]'],
	['\\- not a list', 'Markup[Paragraph[Text[- not a list]]]'],
	['1\\. not a list', 'Markup[Paragraph[Text[1. not a list]]]'],
	['\\# not a heading', 'Markup[Paragraph[Text[# not a heading]]]'],
	// A backslash before anything else stays a literal backslash, so paths and regexes survive.
	['C:\\shared', 'Markup[Paragraph[Text[C:\\shared]]]'],
	['match \\d+ digits', 'Markup[Paragraph[Text[match \\d+ digits]]]'],
	// A target that isn't a web address is a reference to a role or process.
	['<Amy@registrar>', 'Markup[Paragraph[Reference[Amy@registrar]]]'],
	['<Amy@Chief of Staff>', 'Markup[Paragraph[Reference[Amy@Chief of Staff]]]'],
	['<home@adminima.app>', 'Markup[Paragraph[Link[home@adminima.app]]]'],
	['<docs@/org/1/role/2>', 'Markup[Paragraph[Link[docs@/org/1/role/2]]]'],
	// A URL containing the separator used to lose everything after the second one.
	['<mail@mailto:a@b.com>', 'Markup[Paragraph[Link[mail@mailto:a@b.com]]]'],
	// A quote that was never closed used to lose its last character.
	['"unclosed', 'Markup[Quote[Text[unclosed]]]']
])('parse %s', (markup: string, debug: string) => {
	expect(parse(markup).toString()).toBe(debug);
});
