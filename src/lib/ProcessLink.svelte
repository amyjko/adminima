<script lang="ts">
	import type { ProcessID } from '$types/Organization';
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import { getOrg } from './contexts';

	export let processID: ProcessID | null;

	const organization = getOrg();

	$: process = processID ? $organization.getProcess(processID) : undefined;
</script>

{#if process === null}<Oops inline text={(locale) => locale.error.noProcess} />{:else}<Link
		to={processID
			? `/organization/${$organization.getID()}/process/${processID}`
			: `/organization/${$organization.getID()}/processes`}
		kind="process">{process ? process.title : 'Processes'}</Link
	>{/if}
