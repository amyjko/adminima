<script lang="ts">
	import type { ProcessID } from '$types/Organization';
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import { getOrg } from '$routes/+layout.svelte';

	interface Props {
		processID: ProcessID | null;
	}

	let { processID }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);

	let process = $derived(processID ? org.getProcess(processID) : undefined);
</script>

{#if process === null}<Oops inline text="We couldn't find this process" />{:else}<Link
		title={process && process.short.length > 0 ? process.title : undefined}
		to={processID
			? `/org/${org.getPath()}/process/${
					process && process.short.length > 0 ? process.short[0] : processID
				}`
			: `/org/${org.getPath()}/processes`}
		kind="process"
		>{process
			? process.short.length > 0
				? process.short[0].replace(/([A-Z]+)/g, ' $1').trim()
				: process.title
			: 'Processes'}</Link
	>{/if}
