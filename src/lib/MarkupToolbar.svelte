<script lang="ts">
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
		undo: () => void;
		redo: () => void;
		toggleSource: () => void;
	}

	let { status, controls, source, mark, kind, undo, redo, toggleSource }: Props = $props();

	/**
	 * A toolbar is one stop in the tab order, not one per button. On a page that renders a dozen
	 * editable descriptions, the difference is a dozen tab presses against a hundred and twenty.
	 */
	let focused = $state(0);
	let toolbar: HTMLDivElement | undefined = $state();

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
>
	<Button tip="Bold" pressed={status.bold} tabindex={stop(0)} action={() => mark('*')}>
		<strong>B</strong>
	</Button>
	<Button tip="Italic" pressed={status.italic} tabindex={stop(1)} action={() => mark('_')}>
		<em>I</em>
	</Button>
	<Button
		tip="Heading"
		pressed={status.kind === 'heading1'}
		tabindex={stop(2)}
		action={() => kind(status.kind === 'heading1' ? 'paragraph' : 'heading1')}>H1</Button
	>
	<Button
		tip="Subheading"
		pressed={status.kind === 'heading2'}
		tabindex={stop(3)}
		action={() => kind(status.kind === 'heading2' ? 'paragraph' : 'heading2')}>H2</Button
	>
	<Button
		tip="Bulleted list"
		pressed={status.kind === 'bullets'}
		tabindex={stop(4)}
		action={() => kind(status.kind === 'bullets' ? 'paragraph' : 'bullets')}>•</Button
	>
	<Button
		tip="Numbered list"
		pressed={status.kind === 'numbered'}
		tabindex={stop(5)}
		action={() => kind(status.kind === 'numbered' ? 'paragraph' : 'numbered')}>1.</Button
	>
	<Button
		tip="Block quote"
		pressed={status.kind === 'quote'}
		tabindex={stop(6)}
		action={() => kind(status.kind === 'quote' ? 'paragraph' : 'quote')}>&rdquo;</Button
	>
	<Button tip="Undo" active={status.undoable} tabindex={stop(7)} action={undo}>&#8630;</Button>
	<Button tip="Redo" active={status.redoable} tabindex={stop(8)} action={redo}>&#8631;</Button>
	<Button tip="Markup source" pressed={source} tabindex={stop(9)} action={toggleSource}
		>&lt;/&gt;</Button
	>
</div>

<style>
	.toolbar {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--padding);
		margin-bottom: var(--padding);
	}
</style>
