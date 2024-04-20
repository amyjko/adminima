<script lang="ts">
	import { page } from '$app/stores';
	import Oops from '$lib/Oops.svelte';
	import ProcessView from '$lib/ProcessView.svelte';
	import { getOrg } from '$lib/contexts';

	const org = getOrg();

	$: process = $org.getProcess($page.params.processid);
</script>

{#if process}
	<ProcessView {process} />
{:else}
	<Oops text={(locale) => locale.error.noProcess} />
{/if}
