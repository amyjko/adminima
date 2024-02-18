<script lang="ts">
	import { page } from '$app/stores';
	import Loading from '$lib/Loading.svelte';
	import Oops from '$lib/Oops.svelte';
	import database from '../../../../../database/Database';
	import ProcessView from '$lib/ProcessView.svelte';

	$: process = database.getProcess($page.params.processid);
</script>

{#if $process === undefined}
	<Loading inline={false} />
{:else if $process}
	<ProcessView process={$process} />
{:else}
	<Oops text={(locale) => locale.error.noProcess} />
{/if}
