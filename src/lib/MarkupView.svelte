<script lang="ts">
	import { parse } from '../markup/parser';
	import { type MarkupID } from '$types/Organization';
	import Button from './Button.svelte';
	import type { PostgrestError } from '@supabase/supabase-js';
	import Organizations from '$database/Organizations';
	import Loading from './Loading.svelte';
	import BlocksView from './BlocksView.svelte';
	import { tick } from 'svelte';

	export let markup: MarkupID | null;
	/** What to show if the text isn't set */
	export let unset: string;
	/** If given, allows the markup to edited. Returns an error */
	export let edit: undefined | ((text: string) => Promise<PostgrestError | null>) = undefined;

	let editing = false;
	let height = 0;
	let text = '';
	let doMarkup = getMarkup();
	let input: HTMLTextAreaElement;
	$: scrollHeight = text ? input?.scrollHeight ?? height : height;

	function getMarkup() {
		return markup ? Organizations.getMarkup(markup) : undefined;
	}
</script>

<div class="markup">
	{#if edit}<div class="control">
			<Button
				action={async () => {
					if (editing) {
						if (edit) await edit(text ?? '');
						editing = false;
						doMarkup = getMarkup();
					} else {
						text = (await getMarkup()) ?? '';
						editing = true;
						await tick();
						input?.focus();
					}
				}}
				>{#if editing}&checkmark;{:else}✎{/if}</Button
			>
		</div>
	{/if}
	{#if editing}
		<textarea
			bind:value={text}
			bind:this={input}
			style:height="{editing ? scrollHeight : height}px"
		/>
	{:else}
		<div class="blocks" bind:clientHeight={height}>
			{#if markup === null}
				<BlocksView blocks={parse(`_${unset}_`).blocks} />
			{:else}
				{#await doMarkup}
					{#if text}
						<BlocksView blocks={parse(text ?? '').blocks} />
					{:else}<Loading />{/if}
				{:then text}
					<BlocksView blocks={parse(text ?? '').blocks} />
				{:catch error}
					<p>{error}</p>
				{/await}
			{/if}
		</div>
	{/if}
</div>

<style>
	.markup {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: var(--padding);
		align-items: stretch;
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
		padding: 0;
		outline: var(--border) solid var(--thickness);
		min-height: 5em;
	}

	textarea:focus {
		outline: var(--focus) solid var(--thickness);
	}
</style>
