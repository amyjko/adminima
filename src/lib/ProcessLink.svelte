<script lang="ts">
	import Link from './Link.svelte';
	import database from '../database/Database';
	import Loading from './Loading.svelte';
	import Oops from './Oops.svelte';
	import type { ProcessID } from '../types/Process';
	import { getOrganizationContext } from './contexts';

	export let processID: ProcessID;

	const organization = getOrganizationContext();

	$: process = database.getProcess(processID);
</script>

{#if $process === null}<Loading />{:else if $process === undefined}<Oops
		inline
		text={(locale) => locale.error.noProcess}
	/>{:else}<Link to="/organization/{$process.organization}/process/{processID}"
		>{$process.title}</Link
	>{/if}
