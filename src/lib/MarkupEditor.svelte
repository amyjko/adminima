<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import Host, { type State, type LinkContext } from './editor/host';
	import type { Kind } from './editor/commands';
	import MarkupToolbar from './MarkupToolbar.svelte';
	import ReferencePicker from './ReferencePicker.svelte';
	import Note from './Note.svelte';
	import { mode, setMode } from './editor/mode.svelte';
	import { announce } from './editor/announce.svelte';

	interface Props {
		/** The markup being edited. */
		markup: string;
		/** An HTML id for the editable area, so that other things can point at or focus it. */
		id: string;
		/** Whether a label elsewhere names this editor. */
		labelled?: boolean;
		/** Called when the editor has been asked to save without using the button. */
		save?: () => void;
	}

	let { markup = $bindable(''), id, labelled = false, save }: Props = $props();

	/*
	 * Bound elements are typed as possibly null as well as undefined, because that is what Svelte
	 * actually puts in one when the element goes away. Checking only for undefined let a null
	 * through, and the effect below threw on it -- taking the content with it.
	 */
	let area: HTMLTextAreaElement | undefined | null = $state();
	$effect(() => {
		// Read markup so this runs as the text changes, not only when the element appears.
		markup;
		if (!area) return;
		area.style.height = 'auto';
		area.style.height = `${area.scrollHeight}px`;
	});

	/** The picker is open when there is something for it to work on. */
	let picking = $state<LinkContext | undefined>(undefined);

	let element: HTMLDivElement | undefined | null = $state();
	let host: Host | undefined = $state();
	let status = $state<State>({
		bold: false,
		italic: false,
		kind: 'paragraph',
		undoable: false,
		redoable: false,
		selected: false
	});

	$effect(() => {
		// Svelte clears a bound element to null rather than undefined, so switching to the source
		// view was building an editor around nothing and throwing on the way in.
		const root = element;
		if (!root) return;
		const created = new Host(
			root,
			untrack(() => markup),
			{
				// The editor never adopts a property change, so what goes up cannot come back down
				// and rebuild the document under someone's cursor.
				onChange: (source) => (markup = source),
				onState: (next) => (status = next),
				origin: page.url.origin,
				onToggleSource: () => toggleSource(),
				onLink: (context) => (picking = context)
			}
		);
		created.mount();
		host = created;
		return () => {
			created.destroy();
			host = undefined;
		};
	});

	function toggleSource() {
		const next = mode() === 'source' ? 'rich' : 'source';
		setMode(next);
		announce(next === 'source' ? 'Markup source' : 'Rich text');
		// Switching is a deliberate handover, and the one moment content legitimately crosses
		// between the two views.
		if (next === 'rich') queueMicrotask(() => host?.adopt(markup));
	}
</script>

<div class="editor">
	<MarkupToolbar
		{status}
		controls={id}
		source={mode() === 'source'}
		mark={(format) => host?.toggleMark(format)}
		kind={(kind: Kind) => host?.setKind(kind)}
		link={() => host?.link()}
		undo={() => host?.undo()}
		redo={() => host?.redo()}
		{toggleSource}
	/>

	{#if mode() === 'source'}
		<textarea
			{id}
			bind:this={area}
			bind:value={markup}
			aria-labelledby={labelled ? `${id}-label` : undefined}
			aria-describedby="{id}-help"
			onkeydown={(event) => {
				if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
					event.preventDefault();
					event.stopPropagation();
					save?.();
				}
			}}></textarea>
		<Note>
			<span id="{id}-help">
				<code>*bold*</code>, <code>_italic_</code>, <code>&lt;link@https://url&gt;</code>,
				<code>&lt;name@role or process&gt;</code>, <code>- bullets</code>,
				<code>1. lists</code>, <code># heading</code>, <code>"block quote"</code>
			</span>
		</Note>
	{:else}
		<!--
			Deliberately no role. A textbox role is a leaf, so screen readers stop exposing the
			headings, lists and quotes inside it to structural navigation. A plain editable region is
			already mapped correctly, and Windows screen readers switch to focus mode inside one,
			which is what lets the shortcuts through.

			Deliberately empty, too: the host fills it. Svelte must never own DOM the browser is also
			editing, or re-rendering takes the cursor with it.
		-->
		<!--
			svelte-ignore a11y_no_static_element_interactions
			An editable region carries no role on purpose, as above, so there is none to declare.
		-->
		<div
			{id}
			class="rich"
			contenteditable="true"
			spellcheck="true"
			aria-labelledby={labelled ? `${id}-label` : undefined}
			bind:this={element}
			onkeydown={(event) => {
				if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
					event.preventDefault();
					event.stopPropagation();
					save?.();
				}
			}}
		></div>
	{/if}
</div>

{#if picking !== undefined}
	<ReferencePicker
		context={picking}
		insert={(segments) => host?.applyLink(segments)}
		close={() => {
			picking = undefined;
			// The dialog took the focus; the editor knows where the caret was.
			host?.focus();
		}}
	/>
{/if}

<style>
	.editor {
		width: 100%;
	}

	textarea,
	.rich {
		display: block;
		/* Keeps the spaces people type, and stops the browser inventing ones they did not. */
		white-space: pre-wrap;
		width: 100%;
		font-family: inherit;
		font-size: inherit;
		line-height: inherit;
		border: none;
		padding: var(--padding);
		outline: var(--border) solid var(--thickness);
		border-radius: var(--radius);
		min-height: 2em;
	}

	textarea:focus,
	.rich:focus {
		outline: var(--focus) solid var(--thickness);
	}

	.rich :global([data-pill]) {
		border-radius: var(--radius);
		padding: 0 var(--padding);
		background: var(--chrome);
		white-space: nowrap;
	}
</style>
