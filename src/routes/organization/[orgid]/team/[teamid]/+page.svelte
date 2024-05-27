<script lang="ts">
	import Oops from '$lib/Oops.svelte';
	import { getOrg } from '$lib/contexts';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';
	import { page } from '$app/stores';
	import MarkupView from '$lib/MarkupView.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import Admin from '$lib/Admin.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Button from '$lib/Button.svelte';
	import Organizations from '$database/Organizations';
	import { goto } from '$app/navigation';

	const org = getOrg();

	let error: string | undefined = undefined;

	$: teamID = $page.params.teamid;
	$: team = $org.getTeam(teamID);
</script>

{#if team}
	<Title title={team.name} kind={$locale?.term.team} />

	<MarkupView markup={team.description} unset="No description" />

	{#each $org.getTeamRoles(team.id).sort((a, b) => a.title.localeCompare(b.title)) as role}
		<RoleLink roleID={role.id} />
	{/each}
{:else}
	<Oops text="No team" />
{/if}

<Admin>
	<Paragraph>If you delete this team, the roles on it will be without a team.</Paragraph>
	<Button
		action={async () => {
			const err = await Organizations.deleteTeam(teamID);
			if (err) error = err.message;
			else goto(`/organization/${$org.getID()}/roles`);
		}}
		warning>Delete this role</Button
	>
	{#if error}<Oops text={error} />{/if}
</Admin>
