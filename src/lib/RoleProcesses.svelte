<script lang="ts">
	import Subheader from './Subheader.svelte';
	import Flow from './Flow.svelte';
	import ProcessLink from './ProcessLink.svelte';
	import type { HowRow, ProcessRow, RoleRow } from '$database/OrganizationsDB';
	import { getOrg } from './contexts';
	import {
		formatNextDate,
		getNextPeriodDate,
		getNextProcessDate,
		sortProcessesByNextDate
	} from '$database/Period';
	import Note from './Note.svelte';
	import ProcessDate from './ProcessDate.svelte';

	export let role: RoleRow;
	export let processes: ProcessRow[];

	$: sorted = sortProcessesByNextDate(processes);

	const org = getOrg();

	$: hows = sorted
		.map((process) => $org.getHow(process.id))
		.filter((how): how is HowRow => how !== undefined);
	$: accountable = sorted.filter((process) => role.id === process.accountable);
	$: responsible = sorted.filter((process) =>
		$org.getProcessHows(process.id).some((how) => how.responsible.includes(role.id))
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
