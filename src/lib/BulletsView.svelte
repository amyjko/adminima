<script lang="ts">
	import type { default as Bullets } from '../markup/Bullets';
	import SegmentView from '$lib/SegmentView.svelte';

	interface Props {
		block: Bullets;
	}

	let { block }: Props = $props();
</script>

<ul>
	{#each block.items as segments}<li>
			{#each segments as segment}<SegmentView {segment} />{/each}
		</li>{/each}
</ul>
