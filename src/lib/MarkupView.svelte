<script lang="ts">
	import { parse } from '../markup/parser';
	import { type MarkupID } from '$types/Organization';
	import Button from './Button.svelte';
	import type { PostgrestError } from '@supabase/supabase-js';
	import Organizations from '$database/Organizations';
	import Loading from './Loading.svelte';
	import BlocksView from './BlocksView.svelte';
	import { tick } from 'svelte';
	import Error from './Error.svelte';
	import { getDB } from './contexts';

	const db = getDB();

	/** The markup's text */
	export let text: string | undefined = undefined;
	/** The id to optionally load to set the text */
	export let markup: MarkupID | null = null;
	/** What to show if the text isn't set */
	export let unset: string;
	/** If given, allows the markup to edited. Returns an error */
	export let edit: undefined | ((text: string) => Promise<PostgrestError | null> | null) =
		undefined;
	/** Whether in editing state */
	export let editing = false;
	let height = 0;
	let revisedText = '';
	let input: HTMLTextAreaElement;
	let error: PostgrestError | null = null;

	$: scrollHeight = text ? input?.scrollHeight ?? height : height;

	$: if (markup) $db.getMarkup(markup).then((m) => (text = m));

	// Not an edit function, just a text field? Update the text immediately.
	$: if (edit === undefined) text = revisedText;

	async function startEditing() {
		revisedText = text ?? '';
		editing = true;
		await tick();
		input?.focus();
	}

	async function save() {
		if (edit) {
			error = await edit(revisedText ?? '');
			if (error) return;
			editing = false;
			text = revisedText;
		}
	}
</script>

<div class="markup" class:editable={edit !== undefined}>
	{#if edit}<div class="control">
			<Button
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
			{#if error}
				<Error {error} />
			{/if}
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
				on:blur={save}
				style:height="{editing ? scrollHeight : height}px"
			/>
		</div>
	{:else}
		<div class="blocks" bind:clientHeight={height} on:pointerdown|preventDefault={startEditing}>
			{#if !text || text.length === 0}
				<BlocksView blocks={parse(`_${unset}_`).blocks} />
			{:else if text === undefined}
				<Loading />
			{:else}
				<BlocksView blocks={parse(text).blocks} />
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
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
		flex: 1;
	}

	.editable {
		margin-left: calc(-7 * var(--padding));
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
