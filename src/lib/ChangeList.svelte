<script lang="ts">
	import type Change from '../types/Change';
	import ChangeLink from './ChangeLink.svelte';

	export let changes: Change[];
</script>

<ul>
	{#each changes.sort((a, b) => a.mods[0]?.time ?? 0 - b.mods[0]?.time ?? 0) as request}
		<li><ChangeLink requestID={request.id} /></li>
	{:else}
		&mdash;
	{/each}
</ul>
