<script lang="ts">
	import type Person from '../types/Person';
	import Header from './Header.svelte';
	import RoleLink from './RoleLink.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Flow from './Flow.svelte';
	import RoleProcesses from './RoleProcesses.svelte';
	import { getOrg } from './contexts';

	export let person: Person;

	const org = getOrg();

	$: roles = $org.getPersonRoles(person);
</script>

<Title title={person.name} kind={$locale?.term.person} visibility="org" />

<Header>Roles</Header>
<Flow>
	{#each roles as role}
		<RoleLink roleID={role.id} />
	{/each}
</Flow>

<RoleProcesses role={roles[0]} processes={$org.getRoleProcesses(roles[0])} />
