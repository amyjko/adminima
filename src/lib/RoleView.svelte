<script lang="ts">
	import type Role from '../types/Role';
	import Timeline from '$lib/Timeline.svelte';
	import MarkupView from './MarkupView.svelte';
	import database from '../database/Database';
	import Error from './Oops.svelte';
	import Loading from './Loading.svelte';
	import OrganizationLink from './OrganizationLink.svelte';
	import Header from './Header.svelte';
	import PersonLink from './PersonLink.svelte';
	import Paragraph from './Paragraph.svelte';
	import RequestList from './RequestList.svelte';
	import RequestForm from './RequestForm.svelte';

	export let role: Role;
</script>

<Header>Who</Header>
{#each role.people as personID}<PersonLink {personID} />{/each}

<Header>Organization</Header>
<Paragraph><OrganizationLink organizationID={role.organization} /></Paragraph>

<Header>Purpose</Header>
<div class="meta">
	<MarkupView markup={role.what} />
</div>

<Header>Activities</Header>

{#await database.getRoleActivities(role.id)}
	<Loading />
{:then activities}
	<Timeline {activities} />
{:catch}
	<Error text={(locale) => locale.error.noRoleActivities} />
{/await}

<Header>Requests</Header>

<RequestForm organization={role.organization} role={role.id} />

{#await database.getRoleRequests(role.id)}
	<Loading />
{:then requests}
	<RequestList {requests} />
{:catch}
	<Error text={(locale) => locale.error.noRoleActivities} />
{/await}
