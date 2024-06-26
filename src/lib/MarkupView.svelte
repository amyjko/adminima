<script lang="ts">
	import { parse } from '../markup/parser';
	import Button from './Button.svelte';
	import type { PostgrestError } from '@supabase/supabase-js';
	import BlocksView from './BlocksView.svelte';
	import { tick } from 'svelte';
	import { addError, getErrors } from './contexts';
	import Note from './Note.svelte';

	/** The markup's text */
	export let markup: string;
	/** Placeholder text */
	export let placeholder: string;
	/** If given, allows the markup to edited. Returns an error */
	export let edit: undefined | ((text: string) => Promise<PostgrestError | null> | null) =
		undefined;
	/** Whether in editing state */
	export let editing = false;
	/** An HTML id to apply to the text area, if desired */
	export let id: string | undefined = undefined;

	let height = 0;
	let revisedText = '';
	let input: HTMLTextAreaElement;
	let saving = false;

	const errors = getErrors();

	$: scrollHeight = input?.scrollHeight ?? height;

	// Not an edit function, just a text field? Update the text immediately.
	$: if (edit === undefined) markup = revisedText;

	async function startEditing() {
		revisedText = markup ?? '';
		editing = true;
		await tick();
		input?.focus();
	}

	async function save() {
		if (edit) {
			saving = true;
			const error = await edit(revisedText ?? '');
			if (error) {
				addError(errors, 'Unable to save markup.', error);
			} else {
				markup = revisedText;
				editing = false;
			}
			saving = false;
		}
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
				on:keydown={(e) => {
					// Shortcut to submit without using button.
					if (e.key === 'Enter' && e.metaKey) {
						e.preventDefault();
						e.stopPropagation();
						save();
					}
				}}
				style:height="{editing ? scrollHeight : height}px"
			/>
			<Note
				><code>*bold*</code>, <code>_italic_</code>, <code>&lt;link@url&gt;</code>,
				<code>* bullets</code>, <code>1. lists</code></Note
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
			<Button
				tip={editing ? 'Save your edits.' : 'Start editing this markup.'}
				action={async () => {
					if (editing) {
						save();
					} else {
						startEditing();
					}
				}}
				>{#if editing}&checkmark;{:else}✎{/if}</Button
			>
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
		gap: var(--spacing);
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
		min-height: 1em;
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
