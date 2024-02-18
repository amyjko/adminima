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
	import Button from './Button.svelte';
	import Oops from './Oops.svelte';
	import { goto } from '$app/navigation';
	import { user } from '../database/Auth';
	import Admin from './Admin.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';

	export let role: Role;

	$: organization = database.getOrganization(role.organization);
	$: isAdmin = $organization?.admins.includes($user.id);

	let deleteError: string | undefined = undefined;
</script>

<Title title={role.title} kind={$locale?.term.role} />

{#if role.public || isAdmin}
	{#if role.public}public{:else}private{/if}

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

	<Admin>
		<Header>delete</Header>
		<Paragraph
			>Is this role obsolete? You can delete it, but it is permanent. All of the activities for this
			role will remain, in case you want to assign them to a different role.</Paragraph
		>
		<Button
			action={async () => {
				try {
					const org = role.organization;
					await database.deleteRole(role.id);
					goto(`/organization/${org}`);
				} catch (_) {
					deleteError = "We couldn't delete this";
				}
			}}
			warning>Delete this role</Button
		>
		{#if deleteError}<Oops text={deleteError} />{/if}
	</Admin>
{:else}
	<Oops text="This role is not public." />
{/if}
