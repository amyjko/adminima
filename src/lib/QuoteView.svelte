<script lang="ts">
	import type Quote from '../markup/Quote';
	import SegmentsView from '$lib/SegmentsView.svelte';

	interface Props {
		block: Quote;
	}

	let { block }: Props = $props();
</script>

<blockquote>
	{#each block.blocks as segments}
		<p>
			<SegmentsView {segments} />
		</p>
	{/each}
</blockquote>

<style>
	blockquote {
		margin-inline-start: var(--spacing);
		margin-inline-end: var(--spacing);
		padding-inline-start: var(--spacing);
		border-inline-start: solid var(--thickness) var(--chrome);
		font-style: italic;
	}
</style>
