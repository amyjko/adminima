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
		title={process && process.short.length > 0 ? process.title : undefined}
		to={processID
			? `/org/${$organization.getPath()}/process/${
					process && process.short.length > 0 ? process.short : processID
			  }`
			: `/org/${$organization.getPath()}/processes`}
		kind="process"
		>{process
			? process.short.length > 0
				? process.short[0].replace(/([A-Z]+)/g, ' $1').trim()
				: process.title
			: 'Processes'}</Link
	>{/if}
