<script lang="ts">
	import type { default as ParagraphMarkup } from '../markup/Paragraph';
	import Paragraph from './Paragraph.svelte';
	import SegmentsView from '$lib/SegmentsView.svelte';

	export let block: ParagraphMarkup;
	export let inline = false;
</script>

{#if inline}<SegmentsView segments={block.segments} />{:else}
	<Paragraph><SegmentsView segments={block.segments} /></Paragraph>{/if}
