<script lang="ts">
	import type Text from '../markup/Text';

	export let segment: Text;
</script>

{#if segment.format === '*'}
	<strong>{segment.text}</strong>
{:else if segment.format === '_'}
	<em>{segment.text}</em>
{:else}
	<span>{segment.text}</span>
{/if}
