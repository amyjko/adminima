<script lang="ts">
	import type Segment from '../markup/Segment';
	import SegmentView from './SegmentView.svelte';

	interface Props {
		segments: Segment[];
	}

	let { segments }: Props = $props();
</script>

{#each segments as segment}
	<SegmentView {segment} />
{/each}
