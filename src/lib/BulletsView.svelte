<script lang="ts">
	import type { default as Bullets } from '../markup/Bullets';
	import SegmentView from '$lib/SegmentView.svelte';

	export let block: Bullets;
</script>

<ul>
	{#each block.items as segment}<li><SegmentView {segment} /></li>{/each}
</ul>
