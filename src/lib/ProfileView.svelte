<script lang="ts">
	import Header from './Header.svelte';
	import RoleLink from './RoleLink.svelte';
	import Title from './Title.svelte';
	import Flow from './Flow.svelte';
	import RoleProcesses from './RoleProcesses.svelte';
	import { getDB, getErrors, getOrg, getUser, queryOrError } from './contexts';
	import MarkupView from './MarkupView.svelte';
	import type { ProcessRow, ProfileRow } from '$database/OrganizationsDB';
	import Notice from './Notice.svelte';
	import Tip from './Tip.svelte';

	export let profile: ProfileRow;

	const user = getUser();
	const org = getOrg();
	const db = getDB();
	const errors = getErrors();

	$: roles = $org.getProfileRoles(profile.id);
	$: allProcesses = roles.reduce(
		(processes: ProcessRow[], role) => [...processes, ...$org.getRoleProcesses(role.id)],
		[]
	);
</script>

<Title
	title={profile.name.length === 0 ? '(no name)' : profile.name}
	kind="person"
	edit={$user && profile.personid === $user.id
		? (text) => queryOrError(errors, $db.updateProfileName(profile, text), "Couldn't update name")
		: undefined}
>
	{profile.email}
</Title>

<Tip>People have unique profiles for each organization they are in.</Tip>

{#if profile.personid === null}
	<Notice
		>This person does not yet have an account on Adminima. If they create one, they can add a bio.</Notice
	>
{/if}

<MarkupView
	markup={profile.bio}
	placeholder="No bio"
	edit={$user
		? (text) =>
				queryOrError(errors, $db.updateProfileBio(profile, text), "Coudln't update profile bio.")
		: undefined}
/>

<Header>Roles</Header>
{#if roles.length > 0}
	<Flow>
		{#each roles as role}
			<RoleLink roleID={role.id} />
		{/each}
	</Flow>

	<RoleProcesses role={roles[0]} processes={allProcesses} />
{:else}
	<Notice>This person has no roles in this organization.</Notice>
{/if}
