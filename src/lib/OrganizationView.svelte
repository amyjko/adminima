<script lang="ts">
	import MarkupView from './MarkupView.svelte';
	import Link from './Link.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Paragraph from './Paragraph.svelte';
	import { user } from '$database/Auth';
	import Database from '$database/Database';
	import type Org from '$types/Org';

	export let organization: Org;
</script>

<Title
	title={organization.getName()}
	kind={$locale?.term.organization}
	edit={organization.hasAdmin($user.id)
		? (text) => Database.updateOrganization(organization.withName(text))
		: undefined}
	visibility={organization.getOrganization().visibility}
/>

<MarkupView
	markup={organization.getDescription()}
	edit={organization.hasAdmin($user.id)
		? (text) => Database.updateOrganization(organization.withDescription(text))
		: undefined}
/>

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
