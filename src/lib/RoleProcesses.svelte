<script lang="ts">
	import Subheader from './Subheader.svelte';
	import Flow from './Flow.svelte';
	import ProcessLink from './ProcessLink.svelte';
	import type { HowRow, ProcessRow, RoleRow } from '$database/OrganizationsDB';
	import { getOrg } from './contexts';

	export let role: RoleRow;
	export let processes: ProcessRow[];

	const org = getOrg();

	$: hows = processes
		.map((process) => $org.getHow(process.id))
		.filter((how): how is HowRow => how !== undefined);
	$: accountable = processes.filter((process) => role.id === process.accountable);
	$: responsible = processes.filter((process) =>
		$org.getProcessHows(process.id).some((how) => how.responsible.includes(role.id))
	);
	$: consulted = processes.filter((process) =>
		$org.getProcessHows(process.id).some((how) => how.consulted.includes(role.id))
	);
	$: informed = processes.filter((process) =>
		$org.getProcessHows(process.id).some((how) => how.informed.includes(role.id))
	);
</script>

{#if accountable.length > 0}
	<Subheader>Accountable</Subheader>
	<Flow>
		{#each accountable as process}
			<ProcessLink processID={process.id} />
		{/each}
	</Flow>
{/if}
{#if responsible.length > 0}
	<Subheader>Responsible</Subheader>
	<Flow>
		{#each responsible as process}
			<ProcessLink processID={process.id} />
		{/each}
	</Flow>
{/if}
{#if consulted.length > 0}
	<Subheader>Consulted</Subheader>
	<Flow>
		{#each consulted as process}
			<ProcessLink processID={process.id} />
		{/each}
	</Flow>
{/if}
{#if informed.length > 0}
	<Subheader>Informed</Subheader>
	<Flow>
		{#each hows.filter((how) => how.informed.includes(role.id)) as process}
			<ProcessLink processID={process.id} />
		{/each}
	</Flow>
{/if}
