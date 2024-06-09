<script lang="ts">
	import Header from './Header.svelte';
	import RoleLink from './RoleLink.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Flow from './Flow.svelte';
	import RoleProcesses from './RoleProcesses.svelte';
	import { getOrg, getUser } from './contexts';
	import MarkupView from './MarkupView.svelte';
	import type { ProcessRow, ProfileRow } from '$database/Organizations';
	import Notice from './Notice.svelte';
	import Organizations from '$database/Organizations';

	export let profile: ProfileRow;

	const user = getUser();
	const org = getOrg();

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
		? (text) => Organizations.updateProfileName(profile, text)
		: undefined}
>
	{profile.email}
</Title>

{#if profile.personid === null}
	<Notice
		>This person does not yet have an account on Adminima. If they create one, they can add a bio.</Notice
	>
{/if}

<MarkupView
	markup={profile.bio}
	unset="No bio"
	edit={$user ? (text) => Organizations.updateProfileDescription(profile, text) : undefined}
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
