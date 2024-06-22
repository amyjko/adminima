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
	export let unset: string;
	/** If given, allows the markup to edited. Returns an error */
	export let edit: undefined | ((text: string) => Promise<PostgrestError | null> | null) =
		undefined;
	/** Whether in editing state */
	export let editing = false;
	let height = 0;
	let revisedText = '';
	let input: HTMLTextAreaElement;

	const errors = getErrors();

	$: scrollHeight = markup ? input?.scrollHeight ?? height : height;

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
		<div class="text">
			<!-- svelte-ignore a11y-autofocus -->
			<textarea
				bind:value={revisedText}
				bind:this={input}
				autofocus
				on:keydown={(e) => {
					// Shortcut to submit without using button.
					if (e.key === 'Enter' && e.metaKey) {
						e.preventDefault();
						save();
					}
				}}
				style:height="{editing ? scrollHeight : height}px"
			/>
		</div>
	{:else if markup === ''}<em>{unset}</em>{:else}
		<div class="blocks" bind:clientHeight={height} on:pointerdown|preventDefault={startEditing}>
			<BlocksView blocks={parse(markup).blocks} />
		</div>
	{/if}
</div>

<style>
	.markup {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		gap: calc(2 * var(--padding));
		align-items: stretch;
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
		flex: 1;
	}

	.control {
		align-self: baseline;
	}
	.blocks {
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
	}

	textarea {
		flex: 1;
		font-family: inherit;
		font-size: inherit;
		line-height: inherit;
		border: none;
		padding: var(--padding);
		outline: var(--border) solid var(--thickness);
		min-height: 1em;
		border-radius: var(--radius);
	}

	textarea:focus {
		outline: var(--focus) solid var(--thickness);
	}
</style>
