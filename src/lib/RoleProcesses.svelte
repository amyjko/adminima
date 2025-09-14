<script lang="ts">
	import Subheader from './Subheader.svelte';
	import Flow from './Flow.svelte';
	import ProcessLink from './ProcessLink.svelte';
	import type { HowRow, ProcessRow, RoleRow } from '$database/Organization';
	import { sortProcessesByNextDate } from '$database/Period';
	import ProcessDate from './ProcessDate.svelte';
	import Organization from '$database/Organization';

	interface Props {
		role: RoleRow;
		processes: ProcessRow[];
		hows: HowRow[];
		onlyPeriodic?: boolean;
	}

	let { role, processes, hows, onlyPeriodic = false }: Props = $props();

	let sorted = $derived(sortProcessesByNextDate(processes));

	let accountable = $derived(
		sorted.filter(
			(process) => role.id === process.accountable && (!onlyPeriodic || process.repeat.length > 0)
		)
	);
	let responsible = $derived(
		sorted.filter((process) =>
			Organization.getProcessHows(hows, process.id).some(
				(how) => how.responsible.includes(role.id) && (!onlyPeriodic || process.repeat.length > 0)
			)
		)
	);
	let consulted = $derived(
		sorted.filter((process) =>
			Organization.getProcessHows(hows, process.id).some((how) => how.consulted.includes(role.id))
		)
	);
	let informed = $derived(
		sorted.filter((process) =>
			Organization.getProcessHows(hows, process.id).some((how) => how.informed.includes(role.id))
		)
	);
</script>

{#if accountable.length > 0}
	<Subheader>Accountable</Subheader>
	{#each accountable as process}
		<Flow>
			<ProcessLink wrap {process} />
			<ProcessDate {process} />
		</Flow>
	{/each}
{/if}
{#if responsible.length > 0}
	<Subheader>Responsible</Subheader>
	{#each responsible as process}
		<Flow>
			<ProcessLink wrap {process} />
			<ProcessDate {process} />
		</Flow>
	{/each}
{/if}
{#if !onlyPeriodic}
	{#if consulted.length > 0}
		<Subheader>Consulted</Subheader>
		{#each consulted as process}
			<Flow>
				<ProcessLink wrap {process} />
				<ProcessDate {process} />
			</Flow>
		{/each}
	{/if}
	{#if informed.length > 0}
		<Subheader>Informed</Subheader>
		{#each informed as process}
			<Flow>
				<ProcessLink wrap {process} />
				<ProcessDate {process} />
			</Flow>
		{/each}
	{/if}
{/if}
