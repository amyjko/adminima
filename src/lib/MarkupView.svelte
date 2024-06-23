<script lang="ts">
	import { parse } from '../markup/parser';
	import Button from './Button.svelte';
	import type { PostgrestError } from '@supabase/supabase-js';
	import BlocksView from './BlocksView.svelte';
	import { tick } from 'svelte';
	import { addError, getErrors } from './contexts';

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
			const error = await edit(revisedText ?? '');
			editing = false;
			if (error) {
				addError(errors, 'Unable to save markup.', error);
				return;
			}
			markup = revisedText;
		}
	}
</script>

<div class="markup" class:editable={edit !== undefined}>
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
	{#if editing}
		<!-- svelte-ignore a11y-autofocus -->
		<textarea
			bind:value={revisedText}
			bind:this={input}
			{id}
			autofocus
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
	{:else}
		<div class="blocks" bind:clientHeight={height} on:pointerdown|preventDefault={startEditing}>
			{#if markup === ''}<em>{placeholder}</em>{:else}<BlocksView
					blocks={parse(markup).blocks}
				/>{/if}
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
	}

	textarea:focus {
		outline: var(--focus) solid var(--thickness);
	}
</style>
