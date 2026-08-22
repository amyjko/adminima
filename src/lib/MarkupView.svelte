<script lang="ts">
	import { parse } from '../markup/parser';
	import Button from './Button.svelte';
	import type { MutationResult } from '$database/Organization';
	import BlocksView from './BlocksView.svelte';
	import { tick } from 'svelte';
	import { addError } from '$routes/errors.svelte';
	import Loading from './Loading.svelte';
	import MarkupEditor from './MarkupEditor.svelte';
	import { slide } from 'svelte/transition';
	import { after } from './editor/motion.svelte';

	interface Props {
		/** The markup's text */
		markup: string;
		/** Placeholder text */
		placeholder: string;
		/** If given, allows the markup to edited. Returns an error */
		edit?: undefined | ((text: string) => Promise<MutationResult> | null);
		/** Whether in editing state */
		editing?: boolean;
		/** An HTML id to apply to the text area, if desired */
		id?: string | undefined;
		/** Whether to render the text smaller */
		small?: boolean;
		/** Whether something else on the page names this field, via Labeled's id. */
		labelled?: boolean;
	}

	let {
		markup = $bindable(''),
		placeholder,
		edit = undefined,
		editing = $bindable(false),
		id = undefined,
		small = false,
		labelled = false
	}: Props = $props();

	let revisedText = $state(markup);
	let saving = $state(false);

	/**
	 * The editor needs an id to be named by a label and pointed at by a toolbar, and the process
	 * page focuses steps by id, so one is made when the caller has not given one.
	 */
	let editorID = $derived(id ?? `markup-${Math.abs(hash(placeholder))}`);

	function hash(text: string): number {
		let value = 0;
		for (let index = 0; index < text.length; index++)
			value = (value * 31 + text.charCodeAt(index)) | 0;
		return value;
	}

	// No edit function and revised text changes, update the markup.
	$effect(() => {
		if (edit === undefined) markup = revisedText;
	});

	// If the markup changes, update the revised text of the text area.
	$effect(() => {
		if (edit === undefined && markup !== revisedText) {
			revisedText = markup;
		}
	});

	async function startEditing() {
		revisedText = markup;
		editing = true;
		await tick();
		document.getElementById(editorID)?.focus();
	}

	async function save() {
		// Does this have an editing function? Try to edit.
		if (edit) {
			saving = true;
			try {
				// Request the edit from the database, which reports any error itself.
				const result = await edit(revisedText);
				// On success, show the revised text on the front end.
				if (result === null || result.error === null) {
					markup = revisedText;
				}
			} catch (err) {
				// If there was an error, show it.
				addError('' + err);
			} finally {
				// No matter what happens, stop saving and stop editing.
				editing = false;
				saving = false;
			}
		}
		// Otherwise, it's probably just a form field.
		else markup = revisedText;
	}
</script>

<div class="markup" class:editable={edit !== undefined} class:small>
	<!--
		Both states live in one column, because the row they sit in shares its width between its
		children. While the editor was on its way out and the rendered version was already there,
		they were two children of that row -- so the editor lost half its width and its text wrapped
		on the way past.
	-->
	<div class="content">
		{#if editing}
			<MarkupEditor bind:markup={revisedText} id={editorID} {labelled} save={() => save()} />
		{:else}
			<!--
				No height until the editor has finished leaving, so the two are never both taking up
				room. Nothing is animated here; the wait is the whole point of it.
			-->
			<div class="blocks" in:slide={{ duration: 0, delay: after() }}>
				{#if markup === '' || markup === undefined}<em>{placeholder}</em>{:else}<BlocksView
						blocks={parse(markup).blocks}
					/>{/if}
			</div>
		{/if}
	</div>
	{#if edit}<div class="control">
			{#if saving}<Loading />
			{:else}
				<Button
					tip={editing ? 'Save your edits.' : 'Start editing this markup.'}
					action={() => {
						if (editing) {
							save();
						} else {
							startEditing();
						}
					}}
					active={!saving}
					>{#if editing}&checkmark;{:else}✎{/if}</Button
				>
			{/if}
		</div>
	{/if}
</div>

<style>
	.markup {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: calc(2 * var(--padding));
		align-items: stretch;
		width: 100%;
		font-size: var(--normal-size);
	}
	.small {
		font-size: var(--small-size);
	}

	.content {
		/* One child of the row, whatever is inside it, so the width never has to be shared. */
		flex: 1;
		min-width: 0;
	}

	.control {
		align-self: baseline;
	}
	.blocks {
		display: flex;
		flex-direction: column;
		width: 100%;
	}
</style>
