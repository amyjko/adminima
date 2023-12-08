<script lang="ts">
	import type Characters from '../markup/Characters';

	export let segment: Characters;
</script>

{#if segment.format === '*'}
	<strong>{segment.text}</strong>
{:else if segment.format === '_'}
	<em>{segment.text}</em>
{:else}
	<span>{segment.text}</span>
{/if}
