<script lang="ts">
	import Title from '$lib/Title.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import Header from '$lib/Header.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import RoleProcesses from '$lib/RoleProcesses.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { queryOrError } from '$routes/errors.svelte';
	import MarkupView from '$lib/MarkupView.svelte';
	import Notice from '$lib/Notice.svelte';
	import Tip from '$lib/Tip.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import ChangeLink from '$lib/ChangeLink.svelte';
	import Organization from '$database/Organization';

	let { data } = $props();
	const profile = $derived(data.profile);
	const hows = $derived(data.hows);

	const user = getUser();
	const context = getOrg();

	const dbContext = getDB();
	const db = $derived(dbContext());

	let isAdmin = $derived(context().admin);
	let roles = $derived(Organization.getProfileRoles(profile.id, data.assignments, data.roles));
</script>

<Title
	title={profile.name.length === 0 ? '(no name)' : profile.name}
	kind="profile"
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
		<RoleLink {role} />
		<RoleProcesses
			{role}
			{hows}
			processes={Organization.getRoleProcesses(role.id, data.hows, data.processes)}
			onlyPeriodic
		/>
	{/each}
{:else}
	<Notice>This person has no roles in this organization.</Notice>
{/if}

<Header>Changes</Header>

<Paragraph
	>These are the <strong>{data.changes.length}</strong> changes this person is leading.</Paragraph
>

{#each data.changes as change}
	<ChangeLink wrap {change} />
{/each}
