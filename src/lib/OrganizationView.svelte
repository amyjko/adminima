<script lang="ts">
	import type Organization from '../types/Organization';
	import PersonLink from './PersonLink.svelte';
	import Header from './Header.svelte';
	import Loading from './Loading.svelte';
	import database from '../database/Database';
	import RoleLink from './RoleLink.svelte';
	import RequestList from './RequestList.svelte';

	export let organization: Organization;
</script>

<Header>Administrators</Header>
<p>Who has permissions to change this organization's roles.</p>
<ul>
	{#each organization.admins as admin}
		<li><PersonLink personID={admin} /></li>
	{/each}
</ul>

<Header>Roles</Header>
{#await database.getOrganizationRoles(organization.id)}
	<Loading />
{:then roles}
	<ul>
		{#each roles.sort((a, b) => a.title.localeCompare(b.title)) as role}
			<li><RoleLink roleID={role.id} /></li>
		{/each}
	</ul>
{/await}

<Header>People</Header>
{#await database.getOrganizationPeople(organization.id)}
	<Loading />
{:then people}
	<ul>
		{#each people.sort((a, b) => a.name.localeCompare(b.name)) as person}
			<li><PersonLink personID={person.id} /></li>
		{/each}
	</ul>
{/await}

<Header>Requests</Header>
{#await database.getOrganizationRequests(organization.id)}
	<Loading />
{:then requests}
	<RequestList {requests} />
{/await}
