<script lang="ts">
	import Oops from '$lib/Oops.svelte';
	import { getOrg } from '$lib/contexts';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';
	import { page } from '$app/stores';
	import MarkupView from '$lib/MarkupView.svelte';
	import RoleLink from '$lib/RoleLink.svelte';

	const org = getOrg();

	$: team = $org.getTeam($page.params.teamid);
</script>

{#if team}
	<Title title={team.name} kind={$locale?.term.team} visibility="org" />

	<MarkupView markup={team.description} />

	{#each $org.getTeamRoles(team.id).sort((a, b) => a.title.localeCompare(b.title)) as role}
		<RoleLink roleID={role.id} />
	{/each}
{:else}
	<Oops text="No team" />
{/if}
