<script lang="ts">
	import Bullets from '../markup/Bullets';
	import Numbered from '../markup/Numbered';
	import Paragraph from '../markup/Paragraph';
	import ParagraphView from '$lib/ParagraphView.svelte';
	import BulletsView from '$lib/BulletsView.svelte';
	import NumberedView from '$lib/NumberedView.svelte';
	import type Markup from '../markup/Markup';

	export let markup: Markup;
</script>

{#each markup.blocks as block}
	{#if block instanceof Paragraph}
		<ParagraphView {block} />
	{:else if block instanceof Bullets}
		<BulletsView {block} />
	{:else if block instanceof Numbered}
		<NumberedView {block} />
	{/if}
{/each}
