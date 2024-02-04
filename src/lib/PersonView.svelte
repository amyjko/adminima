<script lang="ts">
	import type Person from '../types/Person';
	import OrganizationLink from './OrganizationLink.svelte';
	import Header from './Header.svelte';
	import database from '../database/Database';
	import Loading from './Loading.svelte';
	import RoleLink from './RoleLink.svelte';

	export let person: Person;
</script>

<div class="scope" />

<Header>Roles</Header>
{#await database.getPersonRoles(person.id)}
	<Loading />
{:then roles}
	{#each roles as role}
		<RoleLink roleID={role.id} />
	{/each}
{/await}

<Header>Organizations</Header>
{#each person.organizations as organizationID}
	<OrganizationLink {organizationID} />
{:else}
	Not part of any organizations.
{/each}

<style>
	.scope {
		display: flex;
		flex-direction: column;
	}
</style>
