<script lang="ts">
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import type { ProcessID } from '../types/Process';
	import { getOrg } from './contexts';

	export let processID: ProcessID;

	const organization = getOrg();

	$: process = $organization.getProcess(processID);
</script>

{#if process === null}<Oops inline text={(locale) => locale.error.noProcess} />{:else}<Link
		to="/organization/{$organization.getID()}/process/{processID}">{process.title}</Link
	>{/if}
