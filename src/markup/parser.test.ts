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
	]
])('parse %s', (markup: string, debug: string) => {
	expect(parse(markup).toString()).toBe(debug);
});
