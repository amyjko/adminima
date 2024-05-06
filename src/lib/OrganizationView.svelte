<script lang="ts">
	import MarkupView from './MarkupView.svelte';
	import Link from './Link.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Paragraph from './Paragraph.svelte';
	import Database from '$database/Database';
	import type Org from '$types/Org';
	import { getUser } from './contexts';

	export let organization: Org;

	const user = getUser();

	$: editable = $user && organization.hasAdmin($user.id);
</script>

<Title
	title={organization.getName()}
	kind={$locale?.term.organization}
	edit={editable
		? (text) => Database.updateOrganizationName(organization.getID(), text)
		: undefined}
	visibility={organization.getOrganization().visibility}
/>

{#if organization.getDescription().length === 0}
	<Paragraph><em>No description.</em></Paragraph>
{:else}
	<MarkupView
		markup={organization.getDescription()}
		edit={editable
			? (text) => Database.updateOrganization(organization.withDescription(text))
			: undefined}
	/>
{/if}

<Paragraph>
	See <Link kind="role" to="/organization/{organization.getID()}/roles">Roles</Link> people have in this
	organization.</Paragraph
>

<Paragraph
	>See <Link kind="person" to="/organization/{organization.getID()}/people">People</Link> in this organization.</Paragraph
>

<Paragraph
	>See <Link kind="process" to="/organization/{organization.getID()}/processes">Processes</Link>
	that make this organization work.</Paragraph
>

<Paragraph
	>See <Link kind="change" to="/organization/{organization.getID()}/changes">Changes</Link> proposed
	to make this organization work better.</Paragraph
>
