import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Reading the clipboard back is how the tests below check what a paste elsewhere would get.
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

/**
 * The editor, driven by a real browser.
 *
 * Everything here is behavior no unit test can reach: where the caret lands, what a keystroke
 * actually does to the DOM, whether a reference deletes as one object. The editor is mounted on a
 * bare element rather than reached through a page, so that these run without a signed in account.
 */

async function open(page: import('@playwright/test').Page, source: string) {
	await page.goto('/');
	await page.evaluate(async (initial) => {
		// A URL the dev server resolves, not a path TypeScript can follow from here.
		const path = '/src/lib/editor/host.ts';
		const { default: Host } = await import(path);
		const root = document.createElement('div');
		root.id = 'editor';
		root.setAttribute('contenteditable', 'true');
		// The same whitespace handling the component gives it, which the behavior depends on.
		root.style.whiteSpace = 'pre-wrap';
		// Above the page it is borrowing, so that clicks reach it rather than the layout on top.
		root.style.position = 'relative';
		root.style.zIndex = '9999';
		root.style.background = 'white';
		document.body.prepend(root);
		const host = new Host(root, initial, {
			onChange: (source: string) => ((window as never as Record<string, unknown>).source = source),
			onState: (next: unknown) => ((window as never as Record<string, unknown>).editorState = next),
			onLink: (context: unknown) => ((window as never as Record<string, unknown>).link = context),
			onToggleSource: () =>
				((window as never as Record<string, unknown>).toggled =
					(((window as never as Record<string, unknown>).toggled as number) ?? 0) + 1)
		});
		host.mount();
		(window as never as Record<string, unknown>).host = host;
		(window as never as Record<string, unknown>).source = initial;
	}, source);
	return page.locator('#editor');
}

function source(page: import('@playwright/test').Page) {
	return page.evaluate(() => (window as never as Record<string, unknown>).source as string);
}

/** Put the caret a number of characters into a line, the way a person clicking would. */
async function caret(page: import('@playwright/test').Page, selector: string, offset: number) {
	await page.evaluate(
		({ selector, offset }) => {
			(document.getElementById('editor') as HTMLElement).focus();
			const line = document.querySelector(selector)!;
			const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
			let seen = 0;
			let node = walker.nextNode();
			while (node !== null) {
				const length = (node as Text).data.length;
				if (seen + length >= offset) break;
				seen += length;
				node = walker.nextNode();
			}
			const range = document.createRange();
			range.setStart(node ?? line, node ? offset - seen : 0);
			range.collapse(true);
			const selection = getSelection()!;
			selection.removeAllRanges();
			selection.addRange(range);
		},
		{ selector, offset }
	);
}

test('typing goes in without the editor touching the DOM', async ({ page }) => {
	const editor = await open(page, 'hello');
	await caret(page, '#editor p', 5);
	await page.keyboard.type(' world');
	await expect(editor).toHaveText('hello world');
	expect(await source(page)).toBe('hello world');
});

test('enter splits a paragraph in two', async ({ page }) => {
	await open(page, 'hello world');
	await caret(page, '#editor p', 5);
	await page.keyboard.press('Enter');
	expect(await source(page)).toBe('hello\n\n world');
	// And the caret is at the start of the second one, so typing continues there.
	await page.keyboard.type('X');
	expect(await source(page)).toBe('hello\n\nX world');
});

test('enter in a list makes another item, and again leaves the list', async ({ page }) => {
	await open(page, '- one');
	await caret(page, '#editor li', 3);
	await page.keyboard.press('Enter');
	await page.keyboard.type('two');
	expect(await source(page)).toBe('- one\n- two');
	await page.keyboard.press('Enter');
	await page.keyboard.press('Enter');
	await page.keyboard.type('after');
	expect(await source(page)).toBe('- one\n- two\n\nafter');
});

test('backspace at the start of a list item backs out of the list', async ({ page }) => {
	await open(page, '- one\n- two');
	await caret(page, '#editor li:nth-child(2)', 0);
	await page.keyboard.press('Backspace');
	expect(await source(page)).toBe('- onetwo');
});

test('a reference is one step of travel and one backspace', async ({ page }) => {
	const editor = await open(page, 'see <Amy@registrar> now');
	await expect(editor.locator('[data-pill]')).toHaveText('Amy');

	// Right from just before the pill steps over the whole thing, not into it.
	await caret(page, '#editor p', 4);
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('Backspace');
	expect(await source(page)).toBe('see  now');
});

test('bold applies to a selection and comes back off', async ({ page }) => {
	await open(page, 'hello world');
	await caret(page, '#editor p', 0);
	for (let index = 0; index < 5; index++) await page.keyboard.press('Shift+ArrowRight');
	await page.keyboard.press('ControlOrMeta+b');
	expect(await source(page)).toBe('*hello* world');
});

test('undo steps back over a burst of typing, not a letter', async ({ page }) => {
	await open(page, 'start');
	await caret(page, '#editor p', 5);
	await page.keyboard.type(' more words');
	await page.keyboard.press('ControlOrMeta+z');
	expect(await source(page)).toBe('start');
	await page.keyboard.press('ControlOrMeta+Shift+z');
	expect(await source(page)).toBe('start more words');
});

test('blocks nobody touched keep the bytes they were written with', async ({ page }) => {
	// Every other block here is in a form reserializing would otherwise rewrite.
	await open(page, '* a bullet\n\n\n\nchange me\n\n#### deep heading');
	await caret(page, '#editor p', 9);
	await page.keyboard.type('!');
	expect(await source(page)).toBe('* a bullet\n\n\n\nchange me!\n\n#### deep heading');
});

test('the shortcut for markup source is the one the help text promises', async ({ page }) => {
	await open(page, 'hello');
	await caret(page, '#editor p', 5);
	await page.keyboard.press('ControlOrMeta+Shift+m');
	expect(await page.evaluate(() => (window as never as Record<string, unknown>).toggled)).toBe(1);
	// And it did not also type an m.
	expect(await source(page)).toBe('hello');
});

test('tab is left alone, so the toolbar stays one key away', async ({ page }) => {
	// Editors that capture Tab for indentation are why Alt+F10 exists. This grammar has no nesting,
	// so Tab keeps its ordinary meaning and the toolbar needs no shortcut of its own.
	const editor = await open(page, 'hello');
	await caret(page, '#editor p', 5);
	await page.keyboard.press('Tab');
	await expect(editor).toHaveText('hello');
	expect(await source(page)).toBe('hello');
	expect(await page.evaluate(() => document.activeElement?.id)).not.toBe('editor');
});

/** Select from one offset in one line to another offset in another, the way dragging would. */
async function selectAcross(
	page: import('@playwright/test').Page,
	from: { selector: string; offset: number },
	to: { selector: string; offset: number }
) {
	await page.evaluate(
		({ from, to }) => {
			(document.getElementById('editor') as HTMLElement).focus();
			const find = (selector: string, offset: number) => {
				const line = document.querySelector(selector)!;
				const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
				let seen = 0;
				let node = walker.nextNode();
				while (node !== null) {
					const length = (node as Text).data.length;
					if (seen + length >= offset) return { node, offset: offset - seen };
					seen += length;
					node = walker.nextNode();
				}
				return { node: line as Node, offset: 0 };
			};
			const start = find(from.selector, from.offset);
			const end = find(to.selector, to.offset);
			const range = document.createRange();
			range.setStart(start.node, start.offset);
			range.setEnd(end.node, end.offset);
			const selection = getSelection()!;
			selection.removeAllRanges();
			selection.addRange(range);
		},
		{ from, to }
	);
}

test('what the browser does with a cut across paragraphs', async ({ page }) => {
	await open(page, 'first line\n\nsecond line');
	await selectAcross(
		page,
		{ selector: '#editor p:nth-child(1)', offset: 6 },
		{ selector: '#editor p:nth-child(2)', offset: 7 }
	);
	await page.keyboard.press('ControlOrMeta+x');
	expect(await source(page)).toBe('first line');
});

test('what the browser does with a copy and paste across paragraphs', async ({ page }) => {
	await open(page, 'first line\n\nsecond line');
	await selectAcross(
		page,
		{ selector: '#editor p:nth-child(1)', offset: 0 },
		{ selector: '#editor p:nth-child(2)', offset: 6 }
	);
	await page.keyboard.press('ControlOrMeta+c');
	await caret(page, '#editor p:nth-child(2)', 11);
	await page.keyboard.press('ControlOrMeta+v');
	expect(await source(page)).toBe('first line\n\nsecond line\n\nfirst line\n\nsecond');
});

test('a copied reference is still a reference when pasted back', async ({ page }) => {
	// Offsets here count raw text, where the pill contributes its whole label, so this covers the
	// reference and the words on either side of it.
	await open(page, 'see <Amy@registrar> now');
	await selectAcross(
		page,
		{ selector: '#editor p', offset: 0 },
		{ selector: '#editor p', offset: 11 }
	);
	await page.keyboard.press('ControlOrMeta+c');
	await caret(page, '#editor p', 11);
	await page.keyboard.press('ControlOrMeta+v');
	expect(await source(page)).toBe('see <Amy@registrar> nowsee <Amy@registrar> now');
});

test('formatting survives a copy across paragraphs', async ({ page }) => {
	await open(page, 'a *bold* word\n\nsecond');
	await selectAcross(
		page,
		{ selector: '#editor p:nth-child(1)', offset: 0 },
		{ selector: '#editor p:nth-child(2)', offset: 6 }
	);
	await page.keyboard.press('ControlOrMeta+c');
	await caret(page, '#editor p:nth-child(2)', 6);
	await page.keyboard.press('ControlOrMeta+v');
	expect(await source(page)).toBe('a *bold* word\n\nsecond\n\na *bold* word\n\nsecond');
});

test('a reference survives a copy across paragraphs', async ({ page }) => {
	// Across blocks the clipboard is the browser's to write, so what comes back is the editor's own
	// HTML rather than markup. A reference must survive that too, or copying a paragraph quietly
	// turns every reference in it into plain words.
	await open(page, 'see <Amy@registrar> now\n\nsecond');
	await selectAcross(
		page,
		{ selector: '#editor p:nth-child(1)', offset: 0 },
		{ selector: '#editor p:nth-child(2)', offset: 6 }
	);
	await page.keyboard.press('ControlOrMeta+c');
	await caret(page, '#editor p:nth-child(2)', 6);
	await page.keyboard.press('ControlOrMeta+v');
	expect(await source(page)).toBe(
		'see <Amy@registrar> now\n\nsecond\n\nsee <Amy@registrar> now\n\nsecond'
	);
});

test('the clipboard carries rendered text, the same way everywhere', async ({ page }) => {
	// Copy and cut are the browser's, in every case, so an external paste reads the same whether a
	// phrase or three paragraphs were selected. This markup is not meant to travel.
	await open(page, 'a *bold* word\n\nsecond line');

	await selectAcross(
		page,
		{ selector: '#editor p:nth-child(1)', offset: 2 },
		{ selector: '#editor p:nth-child(1)', offset: 6 }
	);
	await page.keyboard.press('ControlOrMeta+c');
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('bold');

	await selectAcross(
		page,
		{ selector: '#editor p:nth-child(1)', offset: 0 },
		{ selector: '#editor p:nth-child(2)', offset: 6 }
	);
	await page.keyboard.press('ControlOrMeta+c');
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('a bold word\n\nsecond');
});

test('cutting within a line takes out just what was selected', async ({ page }) => {
	await open(page, 'keep remove keep');
	await selectAcross(
		page,
		{ selector: '#editor p', offset: 5 },
		{ selector: '#editor p', offset: 12 }
	);
	await page.keyboard.press('ControlOrMeta+x');
	expect(await source(page)).toBe('keep keep');
});

test('cutting formatted text leaves the formatting around it intact', async ({ page }) => {
	await open(page, 'a *bold and more* word');
	await selectAcross(
		page,
		{ selector: '#editor p', offset: 7 },
		{ selector: '#editor p', offset: 16 }
	);
	await page.keyboard.press('ControlOrMeta+x');
	expect(await source(page)).toBe('a *bold* word');
});

test('enter with text selected replaces it', async ({ page }) => {
	await open(page, 'keep remove keep');
	await selectAcross(
		page,
		{ selector: '#editor p', offset: 5 },
		{ selector: '#editor p', offset: 12 }
	);
	await page.keyboard.press('Enter');
	expect(await source(page)).toBe('keep \n\nkeep');
});

test('enter with a selection spanning blocks replaces all of it', async ({ page }) => {
	await open(page, 'first line\n\nsecond line');
	await selectAcross(
		page,
		{ selector: '#editor p:nth-child(1)', offset: 6 },
		{ selector: '#editor p:nth-child(2)', offset: 7 }
	);
	await page.keyboard.press('Enter');
	expect(await source(page)).toBe('first \n\nline');
});

test('backspace with text selected deletes just that', async ({ page }) => {
	await open(page, 'keep remove keep');
	await selectAcross(
		page,
		{ selector: '#editor p', offset: 5 },
		{ selector: '#editor p', offset: 12 }
	);
	await page.keyboard.press('Backspace');
	expect(await source(page)).toBe('keep keep');
});

test('backspace with a selection spanning blocks joins what is left', async ({ page }) => {
	await open(page, 'first line\n\nsecond line');
	await selectAcross(
		page,
		{ selector: '#editor p:nth-child(1)', offset: 6 },
		{ selector: '#editor p:nth-child(2)', offset: 7 }
	);
	await page.keyboard.press('Backspace');
	expect(await source(page)).toBe('first line');
});

test('backspace at the start of a heading gives a paragraph', async ({ page }) => {
	await open(page, '# Title');
	await caret(page, '#editor h3', 0);
	await page.keyboard.press('Backspace');
	expect(await source(page)).toBe('Title');
});

test('backspace at the start of a quote gives a paragraph', async ({ page }) => {
	await open(page, '"quoted"');
	await caret(page, '#editor blockquote p', 0);
	await page.keyboard.press('Backspace');
	expect(await source(page)).toBe('quoted');
});

test('enter at the end of a quoted line makes another quoted line', async ({ page }) => {
	await open(page, '"one"');
	await caret(page, '#editor blockquote p', 3);
	await page.keyboard.press('Enter');
	await page.keyboard.type('two');
	expect(await source(page)).toBe('"one"\n"two"');
});

test('enter twice at the end of a quote leaves it', async ({ page }) => {
	await open(page, '"one"');
	await caret(page, '#editor blockquote p', 3);
	await page.keyboard.press('Enter');
	await page.keyboard.press('Enter');
	await page.keyboard.type('after');
	expect(await source(page)).toBe('"one"\n\nafter');
});

/**
 * Assert on the state the toolbar is given.
 *
 * A selection change reaches the host through an event, so reading the state straight after moving
 * the caret races it. Polling is not papering over anything -- for a person the toolbar updates
 * within a frame -- but a test reading across processes has to wait for it.
 */
async function expectStatus(
	page: import('@playwright/test').Page,
	expected: Record<string, unknown>
) {
	await expect.poll(() => status(page)).toMatchObject(expected);
}

function status(page: import('@playwright/test').Page) {
	return page.evaluate(
		() =>
			(window as never as Record<string, unknown>).editorState as {
				bold: boolean;
				italic: boolean;
				kind: string;
				selected: boolean;
			}
	);
}

test('the toolbar state follows a selection over formatted text', async ({ page }) => {
	await open(page, 'a *bold* word');
	await selectAcross(
		page,
		{ selector: '#editor p', offset: 2 },
		{ selector: '#editor p', offset: 6 }
	);
	await expectStatus(page, { bold: true });

	await selectAcross(
		page,
		{ selector: '#editor p', offset: 8 },
		{ selector: '#editor p', offset: 12 }
	);
	await expectStatus(page, { bold: false });
});

test('the toolbar state follows the caret into formatted text', async ({ page }) => {
	// Putting the cursor inside a bold word, with nothing selected, is how someone checks what they
	// are about to type into. Every word processor shows bold as on there.
	// "a " is 0 to 2, the bold "bold" is 2 to 6, and " word" is 6 to 11.
	await open(page, 'a *bold* word');

	// Inside the bold word.
	await caret(page, '#editor p', 4);
	await expectStatus(page, { bold: true });

	// Just after it, which is where typing would continue it.
	await caret(page, '#editor p', 6);
	await expectStatus(page, { bold: true });

	// Just before it, which is not.
	await caret(page, '#editor p', 2);
	await expectStatus(page, { bold: false });

	// Well clear of it.
	await caret(page, '#editor p', 11);
	await expectStatus(page, { bold: false });
});

test('the toolbar state reads formatting at the very start of a line', async ({ page }) => {
	// Nothing precedes the caret, so the character after it is what it is sitting in.
	await open(page, '*bold* start');
	await caret(page, '#editor p', 0);
	await expectStatus(page, { bold: true });
});

test('italic and bold are tracked apart', async ({ page }) => {
	await open(page, '*bold* and _italic_');
	await caret(page, '#editor p', 2);
	await expectStatus(page, { bold: true, italic: false });
	await caret(page, '#editor p', 15);
	await expectStatus(page, { bold: false, italic: true });
});

test('the toolbar state follows the caret between blocks', async ({ page }) => {
	await open(page, '# Title\n\nplain\n\n- item');
	await caret(page, '#editor h3', 2);
	await expectStatus(page, { kind: 'heading1' });
	await caret(page, '#editor p', 2);
	await expectStatus(page, { kind: 'paragraph' });
	await caret(page, '#editor li', 2);
	await expectStatus(page, { kind: 'bullets' });
});

/** Mount the real toolbar with a given state, and report what it rendered. */
async function toolbar(page: import('@playwright/test').Page, status: Record<string, unknown>) {
	await page.goto('/');
	await page.evaluate(async (status) => {
		const path = '/src/lib/editor/mount.ts';
		const mod = await import(path);
		const target = document.createElement('div');
		target.id = 'toolbar';
		document.body.prepend(target);
		mod.mountToolbar(target, {
			status,
			controls: 'editor',
			source: false,
			mark: () => {},
			kind: () => {},
			undo: () => {},
			redo: () => {},
			toggleSource: () => {}
		});
	}, status);
	return page.locator('#toolbar');
}

const Off = {
	bold: false,
	italic: false,
	kind: 'paragraph',
	undoable: false,
	redoable: false,
	selected: false
};

test('the toolbar renders the pressed state it is given', async ({ page }) => {
	await toolbar(page, { ...Off, bold: true, kind: 'bullets' });
	await expect(page.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByRole('button', { name: 'Italic' })).toHaveAttribute(
		'aria-pressed',
		'false'
	);
	await expect(page.getByRole('button', { name: 'Bulleted list' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(page.getByRole('button', { name: 'Heading', exact: true })).toHaveAttribute(
		'aria-pressed',
		'false'
	);
});

test('undo and redo are not toggles, so they carry no pressed state', async ({ page }) => {
	await toolbar(page, { ...Off, undoable: true });
	await expect(page.getByRole('button', { name: 'Undo' })).not.toHaveAttribute('aria-pressed');
	// Unavailable rather than removed from the page, so it can still be found and read.
	await expect(page.getByRole('button', { name: 'Redo' })).toHaveAttribute('aria-disabled', 'true');
	await expect(page.getByRole('button', { name: 'Undo' })).toHaveAttribute(
		'aria-disabled',
		'false'
	);
});

test('the whole toolbar is one stop in the tab order', async ({ page }) => {
	const row = await toolbar(page, Off);
	const stops = await row
		.locator('button')
		.evaluateAll((buttons) => buttons.filter((b) => b.getAttribute('tabindex') === '0').length);
	expect(stops).toBe(1);
	// And it really is ten buttons sharing that one stop.
	expect(await row.locator('button').count()).toBe(10);
});

test('the arrow keys move along the toolbar', async ({ page }) => {
	const row = await toolbar(page, Off);
	await row.locator('button').first().focus();
	await page.keyboard.press('ArrowRight');
	expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe(
		'Italic'
	);
	await page.keyboard.press('ArrowLeft');
	expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe(
		'Bold'
	);
	// And wraps rather than stopping.
	await page.keyboard.press('ArrowLeft');
	expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe(
		'Markup source'
	);
	await page.keyboard.press('Home');
	expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe(
		'Bold'
	);
});

test('the toolbar says what it controls', async ({ page }) => {
	const row = await toolbar(page, Off);
	await expect(row.getByRole('toolbar')).toHaveAttribute('aria-label', 'Formatting');
	await expect(row.getByRole('toolbar')).toHaveAttribute('aria-controls', 'editor');
});

function link(page: import('@playwright/test').Page) {
	return page.evaluate(
		() =>
			(window as never as Record<string, unknown>).link as {
				text: string;
				target?: string;
				kind?: string;
			}
	);
}

/** Apply a picker result through the host, the way the dialog does. */
async function applyReference(
	page: import('@playwright/test').Page,
	value: { text: string; target: string } | undefined
) {
	await page.evaluate(async (value) => {
		const path = '/src/markup/Reference.ts';
		const { default: Reference } = await import(path);
		const host = (window as never as Record<string, unknown>).host as {
			applyLink: (segments: unknown[]) => void;
		};
		host.applyLink(value === undefined ? [] : [new Reference(value.text, value.target)]);
	}, value);
}

test('the picker is told what is selected', async ({ page }) => {
	await open(page, 'ask someone about it');
	await selectAcross(
		page,
		{ selector: '#editor p', offset: 4 },
		{ selector: '#editor p', offset: 11 }
	);
	await page.keyboard.press('ControlOrMeta+k');
	expect(await link(page)).toMatchObject({ text: 'someone' });
});

test('the picker is told nothing when nothing is selected', async ({ page }) => {
	await open(page, 'plain words');
	await caret(page, '#editor p', 5);
	await page.keyboard.press('ControlOrMeta+k');
	expect(await link(page)).toMatchObject({ text: '' });
});

test('the picker is told which reference the caret is on', async ({ page }) => {
	await open(page, 'see <Amy@registrar> now');
	// The pill is one character of the line, at offset 4.
	await caret(page, '#editor p', 5);
	await page.keyboard.press('ControlOrMeta+k');
	expect(await link(page)).toMatchObject({
		text: 'Amy',
		target: 'registrar',
		kind: 'reference'
	});
});

test('a reference goes in where the selection was', async ({ page }) => {
	await open(page, 'ask someone about it');
	await selectAcross(
		page,
		{ selector: '#editor p', offset: 4 },
		{ selector: '#editor p', offset: 11 }
	);
	await page.keyboard.press('ControlOrMeta+k');
	await applyReference(page, { text: 'Amy', target: 'registrar' });
	expect(await source(page)).toBe('ask <Amy@registrar> about it');
});

test('editing a reference replaces it rather than adding another', async ({ page }) => {
	await open(page, 'see <Amy@registrar> now');
	await caret(page, '#editor p', 5);
	await page.keyboard.press('ControlOrMeta+k');
	await applyReference(page, { text: 'Amy', target: 'treasurer' });
	expect(await source(page)).toBe('see <Amy@treasurer> now');
});

test('the caret lands after a reference, ready to keep typing', async ({ page }) => {
	await open(page, 'ask  about it');
	await caret(page, '#editor p', 4);
	await page.keyboard.press('ControlOrMeta+k');
	await applyReference(page, { text: 'Amy', target: 'registrar' });
	await page.keyboard.type('!');
	expect(await source(page)).toBe('ask <Amy@registrar>! about it');
});

test('a reference can be undone in one step', async ({ page }) => {
	await open(page, 'ask  about it');
	await caret(page, '#editor p', 4);
	await page.keyboard.press('ControlOrMeta+k');
	await applyReference(page, { text: 'Amy', target: 'registrar' });
	await page.keyboard.press('ControlOrMeta+z');
	expect(await source(page)).toBe('ask  about it');
});

test('clicking a reference focuses the editor and selects it for editing', async ({ page }) => {
	// The helpers above focus the editor themselves. A real click has to do it on its own, and a
	// reference is not editable content, so it is worth knowing that it does.
	const editor = await open(page, 'see <Amy@registrar> now');
	await editor.locator('[data-pill]').click();
	expect(await page.evaluate(() => document.activeElement?.id)).toBe('editor');

	await page.keyboard.press('ControlOrMeta+k');
	expect(await link(page)).toMatchObject({ target: 'registrar', kind: 'reference' });
});

test('bold with nothing selected applies to what is typed next', async ({ page }) => {
	await open(page, 'plain');
	await caret(page, '#editor p', 5);
	await page.keyboard.press('ControlOrMeta+b');
	// The toolbar says so before there is anything to see.
	await expectStatus(page, { bold: true });

	await page.keyboard.type('bold');
	expect(await source(page)).toBe('plain*bold*');
});

test('the rest of the word carries on without being intercepted', async ({ page }) => {
	// Only the first keystroke is taken; after it the caret is inside what it made.
	await open(page, '');
	await caret(page, '#editor p', 0);
	await page.keyboard.press('ControlOrMeta+b');
	await page.keyboard.type('several words here');
	expect(await source(page)).toBe('*several words here*');
});

test('bold twice with nothing selected leaves it off again', async ({ page }) => {
	await open(page, 'plain');
	await caret(page, '#editor p', 5);
	await page.keyboard.press('ControlOrMeta+b');
	await page.keyboard.press('ControlOrMeta+b');
	await expectStatus(page, { bold: false });
	await page.keyboard.type('text');
	expect(await source(page)).toBe('plaintext');
});

test('turning bold off inside a bold word applies from there on', async ({ page }) => {
	// "a " is 0 to 2 and the bold "bold" is 2 to 6, so this is the end of the bold run.
	await open(page, 'a *bold*');
	await caret(page, '#editor p', 6);
	await expectStatus(page, { bold: true });
	await page.keyboard.press('ControlOrMeta+b');
	await expectStatus(page, { bold: false });
	await page.keyboard.type(' plain');
	expect(await source(page)).toBe('a *bold* plain');
});

test('moving the caret abandons formatting that was chosen but not used', async ({ page }) => {
	await open(page, 'one two');
	await caret(page, '#editor p', 7);
	await page.keyboard.press('ControlOrMeta+b');
	await expectStatus(page, { bold: true });

	await caret(page, '#editor p', 3);
	await expectStatus(page, { bold: false });
	await page.keyboard.type('X');
	expect(await source(page)).toBe('oneX two');
});

test('italic with nothing selected works the same way', async ({ page }) => {
	await open(page, '');
	await caret(page, '#editor p', 0);
	await page.keyboard.press('ControlOrMeta+i');
	await page.keyboard.type('quiet');
	expect(await source(page)).toBe('_quiet_');
});

test('formatting chosen for what comes next can be undone in one step', async ({ page }) => {
	await open(page, 'plain');
	await caret(page, '#editor p', 5);
	await page.keyboard.press('ControlOrMeta+b');
	await page.keyboard.type('bold');
	await page.keyboard.press('ControlOrMeta+z');
	expect(await source(page)).toBe('plain');
});

test('bold across a block boundary says why it cannot', async ({ page }) => {
	await open(page, 'first\n\nsecond');
	await selectAcross(
		page,
		{ selector: '#editor p:nth-child(1)', offset: 1 },
		{ selector: '#editor p:nth-child(2)', offset: 3 }
	);
	await page.keyboard.press('ControlOrMeta+b');
	expect(await source(page)).toBe('first\n\nsecond');
});

test('an empty document still has somewhere to type', async ({ page }) => {
	// A new comment starts empty. Without a paragraph in it the browser puts what is typed straight
	// into the editable element, where reading back does not look, and none of it would be saved.
	const editor = await open(page, '');
	await expect(editor.locator('p')).toHaveCount(1);
	await editor.click();
	await page.keyboard.type('a first comment');
	expect(await source(page)).toBe('a first comment');
});

test('emptying a document leaves somewhere to carry on', async ({ page }) => {
	const editor = await open(page, 'x');
	await editor.click();
	await page.keyboard.press('End');
	await page.keyboard.press('Backspace');
	expect(await source(page)).toBe('');
	await page.keyboard.type('again');
	expect(await source(page)).toBe('again');
});

/**
 * Type through an input method, the way Japanese, Chinese or Korean text is entered — and the way
 * Android enters everything, including swipes and autocorrect.
 *
 * This is the part of an editor that cannot be reasoned about safely: composition events cannot be
 * cancelled, and anything that touches the DOM while one is running desynchronizes the keyboard's
 * own buffer. Driving it through the devtools protocol is the only automated coverage there is.
 * Chromium only, which is a real limit -- Safari and Android are still hand testing.
 */
async function compose(
	context: import('@playwright/test').BrowserContext,
	page: import('@playwright/test').Page,
	stages: string[],
	commit: string
) {
	const cdp = await context.newCDPSession(page);
	for (const [index, text] of stages.entries())
		await cdp.send('Input.imeSetComposition', {
			text,
			selectionStart: index + 1,
			selectionEnd: index + 1
		});
	await cdp.send('Input.insertText', { text: commit });
	// The read back waits a frame, since a trailing input event follows composition in Chrome.
	await page.waitForTimeout(100);
}

test('composed text goes in where the caret is', async ({ page, context }) => {
	await open(page, 'ab');
	await caret(page, '#editor p', 1);
	await compose(context, page, ['に', 'にほ'], '日本');
	expect(await source(page)).toBe('a日本b');
});

test('composing beside a reference leaves it whole', async ({ page, context }) => {
	// Nothing may rebuild the DOM while a composition is running, and a pill sitting next to one is
	// where that would show up first.
	const editor = await open(page, 'see <Amy@registrar> now');
	// Just before the reference, then one step of travel over it, which is the real way past one.
	await caret(page, '#editor p', 4);
	await page.keyboard.press('ArrowRight');
	await compose(context, page, ['に'], '日本');
	expect(await source(page)).toBe('see <Amy@registrar>日本 now');
	await expect(editor.locator('[data-pill]')).toHaveCount(1);
});

test('composed text can be undone', async ({ page, context }) => {
	await open(page, 'ab');
	await caret(page, '#editor p', 1);
	await compose(context, page, ['に'], '日本');
	expect(await source(page)).toBe('a日本b');
	await page.keyboard.press('ControlOrMeta+z');
	expect(await source(page)).toBe('ab');
});

test('composing into an empty document works', async ({ page, context }) => {
	const editor = await open(page, '');
	await editor.click();
	await compose(context, page, ['に'], '日本');
	expect(await source(page)).toBe('日本');
});

test('composing inside formatted text stays formatted', async ({ page, context }) => {
	await open(page, 'a *bold* word');
	await caret(page, '#editor p', 4);
	await compose(context, page, ['に'], '日本');
	expect(await source(page)).toBe('a *bo日本ld* word');
});

test('formatting chosen for what comes next is dropped rather than lied about', async ({
	page,
	context
}) => {
	// Composition cannot be intercepted, so the choice cannot be honoured. Saying so beats a
	// toolbar insisting the plain text that arrives is bold.
	await open(page, 'ab');
	await caret(page, '#editor p', 1);
	await page.keyboard.press('ControlOrMeta+b');
	await compose(context, page, ['に'], '日本');
	expect(await source(page)).toBe('a日本b');
	await expectStatus(page, { bold: false });
});

/** Mount the whole editor, label and all, the way a page uses it. */
async function field(page: import('@playwright/test').Page, markup: string, labelled = true) {
	await page.goto('/');
	await page.evaluate(
		async ({ markup, labelled }) => {
			const path = '/src/lib/editor/mount.ts';
			const mod = await import(path);
			const wrap = document.createElement('div');
			wrap.id = 'wrap';
			wrap.style.position = 'relative';
			wrap.style.zIndex = '9999';
			wrap.style.background = 'white';
			// What Labeled renders when it is given an id to name something with.
			if (labelled) {
				const label = document.createElement('span');
				label.id = 'field-label';
				label.textContent = 'Describe this role';
				wrap.appendChild(label);
			}
			const target = document.createElement('div');
			wrap.appendChild(target);
			document.body.prepend(wrap);
			mod.mountEditor(target, { markup, id: 'field', labelled });
		},
		{ markup, labelled }
	);
	return page.locator('#wrap');
}

test('the editor is named by the label beside it', async ({ page }) => {
	// A label only names a labelable element, and an editable region is not one, so this is the
	// only thing standing between the field and having no accessible name at all.
	await field(page, 'some text');
	await expect(page.locator('#field')).toHaveAttribute('aria-labelledby', 'field-label');
	await expect(page.locator('#field')).toHaveAttribute('aria-describedby', 'field-help');
	// No role at all: a textbox role is a leaf, and would hide the headings and lists inside it.
	await expect(page.locator('#field')).not.toHaveAttribute('role');
});

test('the editor has no accessibility violations', async ({ page }) => {
	await field(
		page,
		'# Heading\n\nSome *bold* text and a <Amy@registrar> reference.\n\n- one\n- two'
	);
	const results = await new AxeBuilder({ page }).include('#wrap').analyze();
	expect(results.violations.map((v) => `${v.id}: ${v.description}`)).toEqual([]);
});

test('the source view has no accessibility violations either', async ({ page }) => {
	await field(page, '# Heading\n\n- one\n- two');
	await page.getByRole('button', { name: 'Markup source' }).click();
	await expect(page.locator('textarea#field')).toBeVisible();
	const results = await new AxeBuilder({ page }).include('#wrap').analyze();
	expect(results.violations.map((v) => `${v.id}: ${v.description}`)).toEqual([]);
});

/**
 * Every shortcut the help text names, and what it should do.
 *
 * The help text is read out through aria-describedby, so someone who cannot see the toolbar is
 * taking it as fact. Three shortcuts were once named there that had never been written.
 */
const Shortcuts = [
	{ token: '+B', press: 'ControlOrMeta+b', from: 'word', to: '*word*' },
	{ token: '+I', press: 'ControlOrMeta+i', from: 'word', to: '_word_' },
	{ token: '+K', press: 'ControlOrMeta+k', from: 'word', to: 'word' },
	{ token: '+1', press: 'ControlOrMeta+Alt+1', from: 'word', to: '# word' },
	{ token: '+8', press: 'ControlOrMeta+Shift+8', from: 'word', to: '- word' },
	{ token: '+M', press: 'ControlOrMeta+Shift+m', from: 'word', to: 'word' }
];

test('the help text names every shortcut and no others', async ({ page }) => {
	await field(page, 'word');
	const help = (await page.locator('#field-help').textContent()) ?? '';
	// A single character after a plus is the key; anything longer is a modifier being named.
	const named = new Set((help.match(/\+[A-Za-z0-9](?![A-Za-z])/g) ?? []).map((t) => t.toUpperCase()));
	expect([...named].sort()).toEqual([...Shortcuts.map((s) => s.token)].sort());
});

for (const shortcut of Shortcuts) {
	test(`the shortcut ${shortcut.token} does what the help text says`, async ({ page }) => {
		await field(page, shortcut.from);
		await page.locator('#field').click();
		await page.keyboard.press('End');
		// Bold and italic need something to apply to; the rest act on where the caret is.
		if (shortcut.token === '+B' || shortcut.token === '+I')
			for (let index = 0; index < 4; index++) await page.keyboard.press('Shift+ArrowLeft');
		await page.keyboard.press(shortcut.press);

		if (shortcut.token === '+K') {
			// It opens the picker rather than changing anything.
			await expect(page.getByRole('dialog')).toBeVisible();
		} else if (shortcut.token === '+M') {
			await expect(page.locator('textarea#field')).toBeVisible();
		} else {
			await expect
				.poll(() => page.locator('#field').innerText())
				.toContain(shortcut.to.replace(/[*_#-]/g, '').trim());
		}
	});
}
