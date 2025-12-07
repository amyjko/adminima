<script module lang="ts">
	export { ProcessItem };

	const MaxLength = 100;
</script>

<script lang="ts">
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import { DraftSymbol } from './Symbols';
	import Self from './ProcessLink.svelte';
	import type { ProcessRow } from '$database/Organization';
	import Organization, { type ProcessID } from '$database/Organization';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';

	interface Props {
		process: { id: ProcessID; title: string; short: string[]; state: string } | null | undefined;
		wrap?: boolean;
	}

	let { process, wrap }: Props = $props();

	const context = getOrg();
	let org = $derived(context().org);
</script>

{#snippet ProcessItem(process: string | undefined, processes: ProcessRow[])}
	<div class="process-view">
		{#if process}<Self process={processes.find((p) => p.id === process)} />{:else}—{/if}
	</div>
	<style>
		.process-view {
			display: inline-block;
			padding: var(--padding);
		}
	</style>
{/snippet}

{#if process === undefined}<Oops inline text="We couldn't find this process" />{:else}<Link
		{wrap}
		title={process && process.short.length > 0 ? process.title : undefined}
		to={process
			? `/org/${Organization.getPath(org)}/process/${
					process && process.short.length > 0 ? process.short[0] : process.id
				}`
			: `/org/${Organization.getPath(org)}/processes`}
		kind="process"
		icon={process && process.state === 'draft' ? DraftSymbol : undefined}
		>{#if process}
			{process.title.substring(0, MaxLength) + (process.title.length > MaxLength ? '…' : '')}
		{:else}
			<em>unknown process</em>
		{/if}</Link
	>{/if}
