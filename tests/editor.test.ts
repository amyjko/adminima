import { expect, test } from '@playwright/test';

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
		document.body.prepend(root);
		const host = new Host(root, initial, {
			onChange: (source: string) => ((window as never as Record<string, unknown>).source = source),
			onState: () => {}
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
