<script lang="ts">
	import Subheader from './Subheader.svelte';
	import Flow from './Flow.svelte';
	import type Role from '$types/Role';
	import type Process from '$types/Process';
	import ProcessLink from './ProcessLink.svelte';

	export let role: Role;
	export let processes: Process[];
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
	{#each processes.filter((process) => process.responsible.includes(role.id)) as process}
		<ProcessLink processID={process.id} />
	{:else}
		Not responsible for completing any processes.
	{/each}
</Flow>
<Subheader>Consulted</Subheader>
<Flow>
	{#each processes.filter((process) => process.consulted.includes(role.id)) as process}
		<ProcessLink processID={process.id} />
	{:else}
		Not consulted on any processes.
	{/each}
</Flow>
<Subheader>Informed</Subheader>
<Flow>
	{#each processes.filter((process) => process.informed.includes(role.id)) as process}
		<ProcessLink processID={process.id} />
	{:else}
		Not informed about any processes.
	{/each}
</Flow>
