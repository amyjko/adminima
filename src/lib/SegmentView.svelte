<script lang="ts">
	import Characters from '../markup/Text';
	import Link from '../markup/Link';
	import type Segment from '../markup/Segment';
	import TextView from '$lib/TextView.svelte';
	import LinkView from './LinkView.svelte';

	export let segment: Segment;
</script>

{#if segment instanceof Characters}
	<TextView {segment} />
{:else if segment instanceof Link}
	<LinkView {segment} />
{/if}
