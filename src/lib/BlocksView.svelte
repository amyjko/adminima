<script lang="ts">
	import Paragraph from '../markup/Paragraph';
	import Bullets from '../markup/Bullets';
	import Numbered from '../markup/Numbered';
	import Block from '../markup/Block';
	import ParagraphView from './ParagraphView.svelte';
	import BulletsView from './BulletsView.svelte';
	import NumberedView from './NumberedView.svelte';

	export let blocks: Block[];
</script>

{#each blocks as block}
	{#if block instanceof Paragraph}
		<ParagraphView {block} />
	{:else if block instanceof Bullets}
		<BulletsView {block} />
	{:else if block instanceof Numbered}
		<NumberedView {block} />
	{/if}
{/each}
