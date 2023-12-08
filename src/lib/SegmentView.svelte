<script lang="ts">
	import Characters from '../markup/Characters';
	import Link from '../markup/Link';
	import type Segment from '../markup/Segment';
	import CharactersView from '$lib/CharactersView.svelte';
	import LinkView from './LinkView.svelte';

	export let segment: Segment;
</script>

{#if segment instanceof Characters}
	<CharactersView {segment} />
{:else if segment instanceof Link}
	<LinkView {segment} />
{/if}
