<script lang="ts">
	import type { ProcessID } from '$types/Organization';
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import { getOrg } from '$routes/+layout.svelte';
	import { DraftSymbol } from './Symbols';

	interface Props {
		processID: ProcessID | null;
		wrap?: boolean;
	}

	let { processID, wrap }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);

	let process = $derived(processID ? org.getProcess(processID) : undefined);
</script>

{#if process === null}<Oops inline text="We couldn't find this process" />{:else}<Link
		{wrap}
		title={process && process.short.length > 0 ? process.title : undefined}
		to={processID
			? `/org/${org.getPath()}/process/${
					process && process.short.length > 0 ? process.short[0] : processID
				}`
			: `/org/${org.getPath()}/processes`}
		kind="process"
		icon={process && process.state === 'draft' ? DraftSymbol : undefined}
		>{#if process}
			{process.title}
		{:else}
			<em>unknown process</em>
		{/if}</Link
	>{/if}
