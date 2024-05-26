<script lang="ts">
	import type { default as ParagraphMarkup } from '../markup/Paragraph';
	import Paragraph from './Paragraph.svelte';
	import SegmentsView from '$lib/SegmentsView.svelte';

	export let block: ParagraphMarkup;
</script>

<Paragraph><SegmentsView segments={block.segments} /></Paragraph>
