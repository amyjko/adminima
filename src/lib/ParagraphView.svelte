<script lang="ts">
	import type { default as ParagraphMarkup } from '../markup/Paragraph';
	import Paragraph from './Paragraph.svelte';
	import SegmentsView from '$lib/SegmentsView.svelte';

	interface Props {
		block: ParagraphMarkup;
	}

	let { block }: Props = $props();
</script>

<Paragraph><SegmentsView segments={block.segments} /></Paragraph>
