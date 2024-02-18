<script lang="ts">
	import type Role from '../types/Role';
	import Timeline from '$lib/Timeline.svelte';
	import MarkupView from './MarkupView.svelte';
	import database from '../database/Database';
	import Error from './Oops.svelte';
	import Loading from './Loading.svelte';
	import Header from './Header.svelte';
	import PersonLink from './PersonLink.svelte';
	import Paragraph from './Paragraph.svelte';
	import ChangeForm from './ChangeForm.svelte';
	import Button from './Button.svelte';
	import Oops from './Oops.svelte';
	import { goto } from '$app/navigation';
	import Admin from './Admin.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Modifications from '$lib/Modifications.svelte';

	export let role: Role;

	let deleteError: string | undefined = undefined;
</script>

<Title title={role.title} kind={$locale?.term.role} />

<MarkupView markup={role.what} />

<Paragraph
	>This role is held by
	{#each role.people as personID, index}<PersonLink {personID} />{#if index > 0},
		{/if}{#if index < role.people.length - 1} and {/if}{/each}.</Paragraph
>

<Header>Processes</Header>

These are the processes that this role is responsible for.

{#await database.getRoleProcesses(role.id)}
	<Loading />
{:then processes}
	<Timeline {processes} />
{:catch}
	<Error text={(locale) => locale.error.noRoleProcesses} />
{/await}

<ChangeForm organization={role.organization} role={role.id} />

<Modifications mods={role.modifications} />

<Admin>
	<Paragraph
		>Is this role obsolete? You can delete it, but it is permanent. All of the processes for this
		role will remain, in case you want to assign them to a different role.</Paragraph
	>
	<Button
		action={async () => {
			try {
				const org = role.organization;
				await database.deleteRole(role.id);
				goto(`/organization/${org}`);
			} catch (_) {
				deleteError = "We couldn't delete this";
			}
		}}
		warning>Delete this role</Button
	>
	{#if deleteError}<Oops text={deleteError} />{/if}
</Admin>
