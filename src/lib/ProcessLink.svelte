<script lang="ts">
	import type { ProcessID } from '$types/Organization';
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import { getOrg } from './contexts';

	export let processID: ProcessID;

	const organization = getOrg();

	$: process = $organization.getProcess(processID);
</script>

{#if process === null}<Oops inline text={(locale) => locale.error.noProcess} />{:else}<Link
		to="/organization/{$organization.getID()}/process/{processID}"
		kind="process">{process.title}</Link
	>{/if}
