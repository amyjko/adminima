<script lang="ts">
	import Header from './Header.svelte';
	import Flow from './Flow.svelte';
	import type Role from '$types/Role';
	import type Process from '$types/Process';
	import ProcessLink from './ProcessLink.svelte';

	export let role: Role;
	export let processes: Process[];
</script>

<Header>Accountable</Header>
<Flow>
	{#each processes.filter((process) => role.id === process.accountable) as process}
		<ProcessLink processID={process.id} />
	{:else}
		Not accountable for any process outcomes.
	{/each}
</Flow>
<Header>Responsible</Header>
<Flow>
	{#each processes.filter((process) => process.responsible.includes(role.id)) as process}
		<ProcessLink processID={process.id} />
	{:else}
		Not responsible for completing any processes.
	{/each}
</Flow>
<Header>Consulted</Header>
<Flow>
	{#each processes.filter((process) => process.consulted.includes(role.id)) as process}
		<ProcessLink processID={process.id} />
	{:else}
		Not consulted on any processes.
	{/each}
</Flow>
<Header>Informed</Header>
<Flow>
	{#each processes.filter((process) => process.informed.includes(role.id)) as process}
		<ProcessLink processID={process.id} />
	{:else}
		Not informed about any processes.
	{/each}
</Flow>
