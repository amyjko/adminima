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
	import Paragraph from './Paragraph.svelte';
	import ChangeLink from './ChangeLink.svelte';

	export let profile: ProfileRow;

	const user = getUser();
	const org = getOrg();
	const db = getDB();
	const errors = getErrors();

	$: isAdmin = $user && $org.hasAdminPerson($user.id);
	$: roles = $org.getProfileRoles(profile.id);
	$: changes = $org.getChanges().filter((c) => c.lead === profile.id);
</script>

<Title
	title={profile.name.length === 0 ? '(no name)' : profile.name}
	kind="person"
	edit={$user && (profile.personid === $user.id || isAdmin)
		? (text) => queryOrError(errors, $db.updateProfileName(profile, text), "Couldn't update name")
		: undefined}
>
	{profile.email}
</Title>

<Tip admin>People have unique profiles for each organization they are in.</Tip>

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
				queryOrError(errors, $db.updateProfileBio(profile, text), "Couldn't update profile bio.")
		: undefined}
/>

<Header>Roles</Header>

<Paragraph>Roles and duties this person has.</Paragraph>
{#if roles.length > 0}
	{#each roles as role}
		<RoleLink roleID={role.id} />
		<RoleProcesses {role} processes={$org.getRoleProcesses(role.id)} />
	{/each}
{:else}
	<Notice>This person has no roles in this organization.</Notice>
{/if}

<Header>Changes</Header>

<Paragraph>These are changes this person is leading.</Paragraph>

{#each changes as change}
	<ChangeLink id={change.id} />
{/each}
