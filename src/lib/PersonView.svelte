<script lang="ts">
	import type Person from '../types/Person';
	import Header from './Header.svelte';
	import database from '../database/Database';
	import Loading from './Loading.svelte';
	import RoleLink from './RoleLink.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Flow from './Flow.svelte';
	import RoleProcesses from './RoleProcesses.svelte';

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
		<RoleProcesses role={roles[0]} {processes} />
	{/await}
{/await}
