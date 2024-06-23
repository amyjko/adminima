<script lang="ts">
	import type { default as Bullets } from '../markup/Bullets';
	import SegmentView from '$lib/SegmentView.svelte';

	export let block: Bullets;
</script>

<ul>
	{#each block.items as segments}<li>
			{#each segments as segment}<SegmentView {segment} />{/each}
		</li>{/each}
</ul>
