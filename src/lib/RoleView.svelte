<script lang="ts">
	import type Role from '../types/Role';
	import Timeline from '$lib/Timeline.svelte';
	import MarkupView from './MarkupView.svelte';
	import Database from '../database/Database';
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

	export let role: Role;

	let deleteError: string | undefined = undefined;

	const org = getOrg();
</script>

<Title title={role.title} kind={$locale?.term.role} status={role.status} />

<MarkupView markup={role.what} />

<Paragraph
	>This role is held by
	{#each role.people as person, index}<PersonLink person={$org.getPerson(person)} />{#if index > 0},
		{/if}{#if index < role.people.length - 1} and {/if}{:else}no one yet{/each}.</Paragraph
>

<Timeline {role} processes={$org.getRoleProcesses(role)} />

<ChangeForm role={role.id} />

<Revisions mods={role.revisions} />

<Admin>
	<Paragraph
		>Is this role obsolete? You can delete it, but it is permanent. All of the processes for this
		role will remain, in case you want to assign them to a different role.</Paragraph
	>
	<Button
		action={async () => {
			try {
				const org = role.organization;
				await Database.deleteRole(role.id);
				goto(`/organization/${org}`);
			} catch (_) {
				deleteError = "We couldn't delete this";
			}
		}}
		warning>Delete this role</Button
	>
	{#if deleteError}<Oops text={deleteError} />{/if}
</Admin>
