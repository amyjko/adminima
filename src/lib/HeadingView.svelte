<script lang="ts">
	import SegmentView from '$lib/SegmentView.svelte';
	import type Heading from '../markup/Heading';
	import Header from './Header.svelte';
	import Subheader from './Subheader.svelte';

	export let block: Heading;
</script>

{#if block.level === 1}<Header>
		{#each block.text as segment}<SegmentView {segment} />{/each}
	</Header>
{:else}<Subheader>
		{#each block.text as segment}<SegmentView {segment} />{/each}
	</Subheader>{/if}
