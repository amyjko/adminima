<script lang="ts">
	import Bullets from '../markup/Bullets';
	import Numbered from '../markup/Numbered';
	import Paragraph from '../markup/Paragraph';
	import ParagraphView from '$lib/ParagraphView.svelte';
	import BulletsView from '$lib/BulletsView.svelte';
	import NumberedView from '$lib/NumberedView.svelte';
	import { parse } from '../markup/parser';
	import { type Markup as Mark } from '$types/Organization';
	import Button from './Button.svelte';

	export let markup: Mark | null;
	export let inline = false;
	/** If given, allows the markup to be edited */
	export let edit: undefined | ((text: string) => void) = undefined;

	let editing = false;
	let height = 0;
</script>

<div class="markup">
	{#if edit}<Button
			action={() => {
				if (editing) {
					if (edit) edit(markup ?? '');
					editing = false;
				} else editing = true;
			}}
			>{#if editing}&checkmark;{:else}✎{/if}</Button
		>
	{/if}
	{#if editing}
		<textarea bind:value={markup} style:height="{height}px" />
	{:else}
		<div class="blocks" bind:clientHeight={height}>
			{#each parse(markup ?? '').blocks as block}
				{#if block instanceof Paragraph}
					<ParagraphView {block} {inline} />
				{:else if block instanceof Bullets}
					<BulletsView {block} />
				{:else if block instanceof Numbered}
					<NumberedView {block} />
				{/if}
			{/each}
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
	}

	textarea:focus {
		outline: var(--focus) solid var(--thickness);
	}
</style>
