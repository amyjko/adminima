<script lang="ts">
	import type Person from '../types/Person';
	import Header from './Header.svelte';
	import database from '../database/Database';
	import Loading from './Loading.svelte';
	import RoleLink from './RoleLink.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Flow from './Flow.svelte';
	import ProcessLink from './ProcessLink.svelte';

	export let person: Person;
</script>

<Title title={person.name} kind={$locale?.term.person} />

{#await database.getPersonRoles(person.id)}
	<Loading />
{:then roles}
	<Header>Roles</Header>
	<Flow>
		{#each roles as role}
			<RoleLink roleID={role.id} />
		{/each}
	</Flow>

	{#await database.getOrganizationProcesses(roles[0].organization)}
		<Loading />
	{:then processes}
		<Header>Accountable</Header>
		<Flow>
			{#each processes.filter( (process) => roles.some((role) => role.id === process.accountable) ) as process}
				<ProcessLink processID={process.id} />
			{:else}
				Not accountable for any process outcomes.
			{/each}
		</Flow>
		<Header>Responsible</Header>
		<Flow>
			{#each processes.filter( (process) => roles.some( (role) => process.responsible.includes(role.id) ) ) as process}
				<ProcessLink processID={process.id} />
			{:else}
				Not responsible for completing any processes.
			{/each}
		</Flow>
		<Header>Consulted</Header>
		<Flow>
			{#each processes.filter( (process) => roles.some( (role) => process.consulted.includes(role.id) ) ) as process}
				<ProcessLink processID={process.id} />
			{:else}
				Not consulted on any processes.
			{/each}
		</Flow>
		<Header>Informed</Header>
		<Flow>
			{#each processes.filter( (process) => roles.some( (role) => process.informed.includes(role.id) ) ) as process}
				<ProcessLink processID={process.id} />
			{:else}
				Not informed about any processes.
			{/each}
		</Flow>
	{/await}
{/await}
