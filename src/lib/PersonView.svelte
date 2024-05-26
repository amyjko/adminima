<script lang="ts">
	import Header from './Header.svelte';
	import RoleLink from './RoleLink.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Flow from './Flow.svelte';
	import RoleProcesses from './RoleProcesses.svelte';
	import { getOrg } from './contexts';
	import MarkupView from './MarkupView.svelte';
	import type { ProfileRow } from '$database/Organizations';

	export let profile: ProfileRow;

	const org = getOrg();

	$: roles = $org.getPersonRoles(profile.personid);
</script>

<Title title={profile.name} kind={$locale?.term.person} visibility="org" />

<MarkupView markup={profile.bio} unset="No bio" />

<Header>Roles</Header>
<Flow>
	{#each roles as role}
		<RoleLink roleID={role.id} />
	{/each}
</Flow>

<RoleProcesses role={roles[0]} processes={$org.getRoleProcesses(roles[0].id)} />
