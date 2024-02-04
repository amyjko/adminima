<script lang="ts">
	import type Request from '../types/Request';
	import RequestLink from './RequestLink.svelte';

	export let requests: Request[];
</script>

<ul>
	{#each requests.sort((a, b) => a.changes[0]?.time ?? 0 - b.changes[0]?.time ?? 0) as request}
		<li><RequestLink requestID={request.id} /></li>
	{:else}
		&mdash;
	{/each}
</ul>
