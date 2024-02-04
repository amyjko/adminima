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

	export let role: Role;
</script>

<div class="scope">
	<Header>Organization</Header>
	<Paragraph><OrganizationLink organizationID={role.organization} /></Paragraph>

	<Header>Purpose</Header>
	<div class="meta">
		<MarkupView markup={role.what} />
	</div>

	<Header>People with this role</Header>
	<ul>
		{#each role.people as personID}<li><PersonLink {personID} /></li>{/each}
	</ul>

	<Header>Activities</Header>

	{#await database.getRoleActivities(role.id)}
		<Loading />
	{:then activities}
		<Timeline {activities} />
	{:catch}
		<Error text={(locale) => locale.error.noRoleActivities} />
	{/await}
</div>

<style>
	.scope {
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
	}
</style>
