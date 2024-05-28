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

	$: roles = $org.getPersonRoles(profile.personid);
	$: allProcesses = roles.reduce(
		(processes: ProcessRow[], role) => [...processes, ...$org.getRoleProcesses(role.id)],
		[]
	);
</script>

<Title
	title={profile.name}
	kind={$locale?.term.person}
	edit={$user && profile.personid === $user.id
		? (text) => Organizations.updateProfileName(profile, text)
		: undefined}
/>

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
