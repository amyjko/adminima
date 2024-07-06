<script lang="ts">
	import SegmentView from '$lib/SegmentView.svelte';
	import type Heading from '../markup/Heading';
	import Header from './Header.svelte';
	import Subheader from './Subheader.svelte';

	export let block: Heading;
</script>

{#if block.level === 1}<h3>
		{#each block.text as segment}<SegmentView {segment} />{/each}
	</h3>
{:else}<h4>
		{#each block.text as segment}<SegmentView {segment} />{/each}
	</h4>{/if}
