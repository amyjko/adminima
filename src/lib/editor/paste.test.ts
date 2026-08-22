// @vitest-environment happy-dom
import { test, expect } from 'vitest';
import { markupFromHTML, markupFromText } from './paste';
import { serialize } from '../../markup/serializer';

function paste(html: string, origin?: string): string {
	return serialize(markupFromHTML(html, document, origin));
}

test.each([
	['<p>hello</p>', 'hello'],
	['<p>a</p><p>b</p>', 'a\n\nb'],
	['<h1>Title</h1>', '# Title'],
	['<h2>Sub</h2>', '## Sub'],
	// The grammar has two heading levels, so everything below the top shares the second.
	['<h4>Deep</h4>', '## Deep'],
	['<p><strong>bold</strong> and <em>italic</em></p>', '*bold* and _italic_'],
	['<p><b>b</b><i>i</i></p>', '*b*_i_'],
	['<ul><li>one</li><li>two</li></ul>', '- one\n- two'],
	['<ol><li>one</li><li>two</li></ol>', '1. one\n2. two'],
	['<blockquote><p>said</p></blockquote>', '"said"'],
	['<blockquote>said</blockquote>', '"said"'],
	['<div>a div</div>', 'a div'],
	// Bare inline content with no block around it is still a paragraph.
	['just text', 'just text'],
	['<span>just <b>text</b></span>', 'just *text*']
])('pasting %s', (html: string, expected: string) => {
	expect(paste(html)).toBe(expected);
});

test('nested lists flatten rather than pretending to indent', () => {
	// Faking depth with spaces would produce markup that no longer means a list at all.
	expect(paste('<ul><li>one<ul><li>deep</li></ul></li><li>two</li></ul>')).toBe(
		'- one\n- deep\n- two'
	);
});

test('what cannot be expressed is dropped rather than carried along', () => {
	expect(paste('<p>before</p><img src="x.png"><p>after</p>')).toBe('before\n\nafter');
	expect(paste('<p><span style="color:red">colored</span></p>')).toBe('colored');
	expect(paste('<style>p{color:red}</style><p>text</p>')).toBe('text');
});

test('a table becomes lines rather than vanishing', () => {
	expect(paste('<table><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>')).toBe(
		'a — b\n\nc — d'
	);
});

test('a link keeps its address', () => {
	expect(paste('<p><a href="https://example.com">docs</a></p>')).toBe('<docs@https://example.com>');
});

test('a link with no address is just its text', () => {
	expect(paste('<p><a>plain</a></p>')).toBe('plain');
});

test('a link back into the application becomes a reference', () => {
	// Copying a role out of the app and pasting it into a description should give a reference.
	expect(paste('<a href="/org/bakery/role/registrar">Registrar</a>')).toBe('<Registrar@registrar>');
	expect(
		paste(
			'<a href="https://adminima.app/org/bakery/process/onboarding">Onboarding</a>',
			'https://adminima.app'
		)
	).toBe('<Onboarding@onboarding>');
});

test('a link to someone else\u2019s site stays a link', () => {
	expect(
		paste('<a href="https://elsewhere.com/org/x/role/y">Role</a>', 'https://adminima.app')
	).toBe('<Role@https://elsewhere.com/org/x/role/y>');
});

test('layout whitespace does not become content', () => {
	expect(paste('<p>\n  spaced   out\n</p>')).toBe('spaced out');
	expect(paste('<p>   </p><p>real</p>')).toBe('real');
});

test('characters that mean something in markup are escaped on the way in', () => {
	expect(paste('<p>2 * 3 and _under_ and C:\\shared</p>')).toBe(
		'2 \\* 3 and \\_under\\_ and C:\\\\shared'
	);
});

test('plain text is read as markup, so a pasted list is a list', () => {
	expect(serialize(markupFromText('- one\n- two'))).toBe('- one\n- two');
	expect(serialize(markupFromText('# Heading'))).toBe('# Heading');
});
