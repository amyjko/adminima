<script lang="ts">
	import Header from './Header.svelte';
	import RoleLink from './RoleLink.svelte';
	import Title from './Title.svelte';
	import RoleProcesses from './RoleProcesses.svelte';
	import { getOrg } from '$routes/+layout.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { queryOrError } from '$routes/errors.svelte';
	import MarkupView from './MarkupView.svelte';
	import type { ProfileRow } from '$database/OrganizationsDB';
	import Notice from './Notice.svelte';
	import Tip from './Tip.svelte';
	import Paragraph from './Paragraph.svelte';
	import ChangeLink from './ChangeLink.svelte';

	interface Props {
		profile: ProfileRow;
	}

	let { profile }: Props = $props();

	const user = getUser();
	const context = getOrg();
	let org = $derived(context.org);

	const db = getDB();

	let isAdmin = $derived($user && org.hasAdminPerson($user.id));
	let roles = $derived(org.getProfileRoles(profile.id));
	let changes = $derived(org.getChanges().filter((c) => c.lead === profile.id));
</script>

<Title
	title={profile.name.length === 0 ? '(no name)' : profile.name}
	kind="person"
	edit={$user && (profile.personid === $user.id || isAdmin)
		? (text) => queryOrError(db.updateProfileName(profile, text), "Couldn't update name")
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
		? (text) => queryOrError(db.updateProfileBio(profile, text), "Couldn't update profile bio.")
		: undefined}
/>

<Header>Roles</Header>

<Paragraph
	>Roles and recurring processes this person is accountable or responsible for. Use this like a to
	do list, to check for upcoming tasks.</Paragraph
>
{#if roles.length > 0}
	{#each roles as role}
		<RoleLink roleID={role.id} />
		<RoleProcesses {role} processes={org.getRoleProcesses(role.id)} onlyPeriodic />
	{/each}
{:else}
	<Notice>This person has no roles in this organization.</Notice>
{/if}

<Header>Changes</Header>

<Paragraph
	>These are the <strong>{changes.length}</strong> changes this person is leading.</Paragraph
>

{#each changes as change}
	<ChangeLink wrap id={change.id} />
{/each}
