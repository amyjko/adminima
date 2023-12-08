<script lang="ts">
	import type Segment from '../markup/Segment';
	import SegmentView from './SegmentView.svelte';

	export let segments: Segment[];
</script>

{#each segments as segment}
	<SegmentView {segment} />
{/each}
