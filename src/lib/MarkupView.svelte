<script lang="ts">
	import { parse } from '../markup/parser';
	import Button from './Button.svelte';
	import type { PostgrestError } from '@supabase/supabase-js';
	import BlocksView from './BlocksView.svelte';
	import { tick } from 'svelte';
	import { addError } from '$routes/+layout.svelte';
	import Note from './Note.svelte';
	import Loading from './Loading.svelte';

	interface Props {
		/** The markup's text */
		markup: string;
		/** Placeholder text */
		placeholder: string;
		/** If given, allows the markup to edited. Returns an error */
		edit?: undefined | ((text: string) => Promise<PostgrestError | null> | null);
		/** Whether in editing state */
		editing?: boolean;
		/** An HTML id to apply to the text area, if desired */
		id?: string | undefined;
	}

	let {
		markup = $bindable(),
		placeholder,
		edit = undefined,
		editing = $bindable(false),
		id = undefined
	}: Props = $props();

	let height = $state(0);
	let revisedText = $state(markup);
	let input: HTMLTextAreaElement | undefined = $state();
	let scrollHeight = $derived(revisedText ? (input ? input.scrollHeight : height) : height);
	let saving = $state(false);

	// No edit function? Immediately update the markup.
	$effect(() => {
		if (edit === undefined) markup = revisedText;
	});

	async function startEditing() {
		revisedText = markup;
		editing = true;
		await tick();
		input?.focus();
	}

	async function save() {
		// Does this have an editing function? Try to edit.
		if (edit) {
			saving = true;
			try {
				// Request the edit from the database.
				const error = await edit(revisedText);
				// If there was an error, show the error.
				if (error) {
					addError('Unable to save markup.', error);
				}
				// Otherwise, on success, show the revised text on the front end.
				else {
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

<div class="markup" class:editable={edit !== undefined}>
	{#if editing}
		<div class="editor">
			<textarea
				bind:value={revisedText}
				bind:this={input}
				{id}
				disabled={saving}
				onkeydown={(e) => {
					// Shortcut to submit without using button.
					if (e.key === 'Enter' && e.metaKey) {
						e.preventDefault();
						e.stopPropagation();
						save();
					}
				}}
				style:height="{editing ? scrollHeight : height}px"
			></textarea>
			<Note
				><code>*bold*</code>, <code>_italic_</code>, <code>&lt;link@https://url&gt;</code>,
				<code>&lt;link@role/process&gt;</code>,
				<code>*/-/• bullets</code>, <code>1. lists</code>, <code>"block quote"</code></Note
			>
		</div>
	{:else}
		<div class="blocks" bind:clientHeight={height}>
			{#if markup === ''}<em>{placeholder}</em>{:else}<BlocksView
					blocks={parse(markup).blocks}
				/>{/if}
		</div>
	{/if}
	{#if edit}<div class="control">
			{#if saving}<Loading text="" />
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

	.editor {
		display: block;
		width: 100%;
	}

	.control {
		align-self: baseline;
	}
	.blocks {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	textarea {
		flex: 1;
		font-family: inherit;
		font-size: inherit;
		line-height: inherit;
		border: none;
		padding: 0;
		outline: var(--border) solid var(--thickness);
		min-height: 2em;
		border-radius: var(--radius);
		width: 100%;
	}

	textarea:focus {
		outline: var(--focus) solid var(--thickness);
	}

	code {
		font-family: monospace;
		font-size: 10pt;
	}
</style>
