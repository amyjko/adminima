<script lang="ts">
	import Characters from '../markup/Text';
	import Link from '../markup/Link';
	import type Segment from '../markup/Segment';
	import TextView from '$lib/TextView.svelte';
	import LinkView from './LinkView.svelte';

	interface Props {
		segment: Segment;
	}

	let { segment }: Props = $props();
</script>

{#if segment instanceof Characters}
	<TextView {segment} />
{:else if segment instanceof Link}
	<LinkView {segment} />
{/if}
