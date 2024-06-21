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
</script>

<Subheader>Accountable</Subheader>
<Flow>
	{#each processes.filter((process) => role.id === process.accountable) as process}
		<ProcessLink processID={process.id} />
	{:else}
		Not accountable for any process outcomes.
	{/each}
</Flow>
<Subheader>Responsible</Subheader>
<Flow>
	{#each hows.filter((how) => how.responsible.includes(role.id)) as process}
		<ProcessLink processID={process.id} />
	{:else}
		Not responsible for completing any processes.
	{/each}
</Flow>
<Subheader>Consulted</Subheader>
<Flow>
	{#each hows.filter((how) => how.consulted.includes(role.id)) as process}
		<ProcessLink processID={process.id} />
	{:else}
		Not consulted on any processes.
	{/each}
</Flow>
<Subheader>Informed</Subheader>
<Flow>
	{#each hows.filter((how) => how.informed.includes(role.id)) as process}
		<ProcessLink processID={process.id} />
	{:else}
		Not informed about any processes.
	{/each}
</Flow>
