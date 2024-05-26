<script lang="ts">
	import Timeline from '$lib/Timeline.svelte';
	import MarkupView from './MarkupView.svelte';
	import Organizations, { type RoleRow } from '../database/Organizations';
	import PersonLink from './PersonLink.svelte';
	import Paragraph from './Paragraph.svelte';
	import ChangeForm from './ChangeForm.svelte';
	import Button from './Button.svelte';
	import Oops from './Oops.svelte';
	import { goto } from '$app/navigation';
	import Admin from './Admin.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Revisions from '$lib/Revisions.svelte';
	import { getOrg } from './contexts';
	import Header from './Header.svelte';
	import TeamLink from './TeamLink.svelte';

	export let role: RoleRow;

	let deleteError: string | undefined = undefined;

	const org = getOrg();
	$: profiles = $org.getRoleProfiles(role.id);
</script>

<Title title={role.title} kind={$locale?.term.role} visibility={null}
	>{#if role.team}&nbsp;&gt; <TeamLink id={role.team} />{/if}</Title
>

<MarkupView markup={role.description} unset="No description yet." />

<Paragraph
	>This role is held by
	{#each profiles as profile, index}<PersonLink {profile} />{#if index > 0},
		{/if}{#if index < profiles.length - 1} and {/if}{:else}no one yet{/each}.</Paragraph
>

<Header>Processes</Header>

<Timeline {role} processes={$org.getRoleProcesses(role.id)} />

<ChangeForm role={role.id} />

<Revisions mods={role.comments} />

<Admin>
	<Paragraph
		>Is this role obsolete? You can delete it, but it is permanent. All of the processes for this
		role will remain, in case you want to assign them to a different role.</Paragraph
	>
	<Button
		action={async () => {
			try {
				const org = role.orgid;
				const error = await Organizations.deleteRole(org, role.id);
				if (error) deleteError = error.message;
				else goto(`/organization/${org}/roles`);
			} catch (_) {
				deleteError = "We couldn't delete this";
			}
		}}
		warning>Delete this role</Button
	>
	{#if deleteError}<Oops text={deleteError} />{/if}
</Admin>
