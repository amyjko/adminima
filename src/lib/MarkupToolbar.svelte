<script lang="ts">
	import { browser } from '$app/environment';
	import { slide } from 'svelte/transition';
	import Button from './Button.svelte';
	import type { State } from './editor/host';
	import type { Kind } from './editor/commands';

	interface Props {
		status: State;
		/** The editor this toolbar acts on, so that it can say what it controls. */
		controls: string;
		source: boolean;
		mark: (format: '*' | '_') => void;
		kind: (kind: Kind) => void;
		link: () => void;
		undo: () => void;
		redo: () => void;
		toggleSource: () => void;
	}

	let { status, controls, source, mark, kind, link, undo, redo, toggleSource }: Props = $props();

	/** Apple keyboards write these as symbols; everywhere else spells them out. */
	let apple = $derived(browser && /Mac|iPhone|iPad/.test(navigator.userAgent));

	/**
	 * Making room for the toolbar shoves everything below it down. Sliding it in shows where the
	 * space came from, rather than the text appearing to jump on its own -- but only for people who
	 * have not asked for less of that.
	 */
	let still = $derived(browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

	/** How a keystroke is written in a tooltip, for the keyboard in front of the person reading it. */
	function shortcut(key: string, { alt = false, shift = false } = {}) {
		return apple
			? `⌘${alt ? '⌥' : ''}${shift ? '⇧' : ''}${key}`
			: `Ctrl+${alt ? 'Alt+' : ''}${shift ? 'Shift+' : ''}${key}`;
	}

	/** The same keystroke in the form aria-keyshortcuts takes, which names modifiers rather than drawing them. */
	function keys(key: string, { alt = false, shift = false } = {}) {
		return `${apple ? 'Meta' : 'Control'}+${alt ? 'Alt+' : ''}${shift ? 'Shift+' : ''}${key}`;
	}

	/**
	 * A toolbar is one stop in the tab order, not one per button. On a page that renders a dozen
	 * editable descriptions, the difference is a dozen tab presses against a hundred and forty.
	 */
	let focused = $state(0);
	let toolbar: HTMLDivElement | undefined | null = $state();

	function buttons(): HTMLButtonElement[] {
		return toolbar ? Array.from(toolbar.querySelectorAll('button')) : [];
	}

	function move(to: number) {
		const all = buttons();
		if (all.length === 0) return;
		focused = (to + all.length) % all.length;
		all[focused]?.focus();
	}

	function navigate(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') move(focused + 1);
		else if (event.key === 'ArrowLeft') move(focused - 1);
		else if (event.key === 'Home') move(0);
		else if (event.key === 'End') move(buttons().length - 1);
		else return;
		event.preventDefault();
	}

	/** Which button is the one tab stop. Recomputed as focus moves along the row. */
	function stop(index: number): number {
		return index === focused ? 0 : -1;
	}

	/** Pressing a block button again puts the block back to being an ordinary paragraph. */
	function toggle(to: Kind) {
		kind(status.kind === to ? 'paragraph' : to);
	}
</script>

<!--
	Pressing a button must not take the selection away from the editor, or there is nothing left to
	make bold. One handler on the row is enough, and cannot be forgotten when a button is added.
-->
<div
	class="toolbar"
	role="toolbar"
	aria-label="Formatting"
	aria-controls={controls}
	tabindex={-1}
	bind:this={toolbar}
	onkeydown={navigate}
	onmousedowncapture={(event) => event.preventDefault()}
	transition:slide={{ duration: still ? 0 : 140 }}
>
	<Button
		tip="Bold"
		shortcut={shortcut('B')}
		keys={keys('B')}
		pressed={status.bold}
		tabindex={stop(0)}
		action={() => mark('*')}
	>
		<strong>B</strong>
	</Button>
	<Button
		tip="Italic"
		shortcut={shortcut('I')}
		keys={keys('I')}
		pressed={status.italic}
		tabindex={stop(1)}
		action={() => mark('_')}
	>
		<em>I</em>
	</Button>
	<Button
		tip="Link or reference"
		shortcut={shortcut('K')}
		keys={keys('K')}
		tabindex={stop(2)}
		action={link}>@</Button
	>
	<Button
		tip="Heading"
		shortcut={shortcut('1', { alt: true })}
		keys={keys('1', { alt: true })}
		pressed={status.kind === 'heading1'}
		tabindex={stop(3)}
		action={() => toggle('heading1')}>h1</Button
	>
	<Button
		tip="Subheading"
		shortcut={shortcut('2', { alt: true })}
		keys={keys('2', { alt: true })}
		pressed={status.kind === 'heading2'}
		tabindex={stop(4)}
		action={() => toggle('heading2')}>h2</Button
	>
	<Button
		tip="Bulleted list"
		shortcut={shortcut('8', { shift: true })}
		keys={keys('8', { shift: true })}
		pressed={status.kind === 'bullets'}
		tabindex={stop(5)}
		action={() => toggle('bullets')}>•</Button
	>
	<Button
		tip="Numbered list"
		shortcut={shortcut('7', { shift: true })}
		keys={keys('7', { shift: true })}
		pressed={status.kind === 'numbered'}
		tabindex={stop(6)}
		action={() => toggle('numbered')}>1.</Button
	>
	<Button
		tip="Block quote"
		shortcut={shortcut('9', { shift: true })}
		keys={keys('9', { shift: true })}
		pressed={status.kind === 'quote'}
		tabindex={stop(7)}
		action={() => toggle('quote')}>&rdquo;</Button
	>
	<Button
		tip="Undo"
		shortcut={shortcut('Z')}
		keys={keys('Z')}
		active={status.undoable}
		tabindex={stop(8)}
		action={undo}>↺</Button
	>
	<Button
		tip="Redo"
		shortcut={shortcut('Z', { shift: true })}
		keys={keys('Z', { shift: true })}
		active={status.redoable}
		tabindex={stop(9)}
		action={redo}>↻</Button
	>
	<Button
		tip="Markup source"
		shortcut={shortcut('M', { shift: true })}
		keys={keys('M', { shift: true })}
		pressed={source}
		tabindex={stop(10)}
		action={toggleSource}>&lt;/&gt;</Button
	>
</div>

<style>
	.toolbar {
		/* Every glyph here comes from the page's own font, so the buttons are all the same height. */
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--padding);
		margin-bottom: var(--padding);
	}
</style>
