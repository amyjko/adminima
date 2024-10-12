<script lang="ts">
	import Subheader from './Subheader.svelte';
	import Flow from './Flow.svelte';
	import ProcessLink from './ProcessLink.svelte';
	import type { HowRow, ProcessRow, RoleRow } from '$database/OrganizationsDB';
	import { getOrg } from './contexts';
	import { sortProcessesByNextDate } from '$database/Period';
	import ProcessDate from './ProcessDate.svelte';

	export let role: RoleRow;
	export let processes: ProcessRow[];
	export let onlyPeriodic = false;

	$: sorted = sortProcessesByNextDate(processes);

	const org = getOrg();

	$: accountable = sorted.filter(
		(process) => role.id === process.accountable && (!onlyPeriodic || process.repeat.length > 0)
	);
	$: responsible = sorted.filter((process) =>
		$org
			.getProcessHows(process.id)
			.some(
				(how) => how.responsible.includes(role.id) && (!onlyPeriodic || process.repeat.length > 0)
			)
	);
	$: consulted = sorted.filter((process) =>
		$org.getProcessHows(process.id).some((how) => how.consulted.includes(role.id))
	);
	$: informed = sorted.filter((process) =>
		$org.getProcessHows(process.id).some((how) => how.informed.includes(role.id))
	);
</script>

{#if accountable.length > 0}
	<Subheader>Accountable</Subheader>
	{#each accountable as process}
		<Flow>
			<ProcessLink processID={process.id} />
			<ProcessDate {process} />
		</Flow>
	{/each}
{/if}
{#if responsible.length > 0}
	<Subheader>Responsible</Subheader>
	{#each responsible as process}
		<Flow>
			<ProcessLink processID={process.id} />
			<ProcessDate {process} />
		</Flow>
	{/each}
{/if}
{#if !onlyPeriodic}
	{#if consulted.length > 0}
		<Subheader>Consulted</Subheader>
		{#each consulted as process}
			<Flow>
				<ProcessLink processID={process.id} />
				<ProcessDate {process} />
			</Flow>
		{/each}
	{/if}
	{#if informed.length > 0}
		<Subheader>Informed</Subheader>
		{#each informed as process}
			<Flow>
				<ProcessLink processID={process.id} />
				<ProcessDate {process} />
			</Flow>
		{/each}
	{/if}
{/if}
