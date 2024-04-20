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
/>

<MarkupView
	markup={organization.getDescription()}
	edit={organization.hasAdmin($user.id)
		? (text) => Database.updateOrganization(organization.withDescription(text))
		: undefined}
/>

<Paragraph>
	See what <Link to="/organization/{organization.getID()}/roles">Roles</Link> people have in this organization.</Paragraph
>

<Paragraph
	>See the <Link to="/organization/{organization.getID()}/people">People</Link> in this organization.</Paragraph
>

<Paragraph
	>See the <Link to="/organization/{organization.getID()}/processes">Processes</Link> that make this
	organization work.</Paragraph
>

<Paragraph
	>Suggest a <Link to="/organization/{organization.getID()}/changes">Change</Link> to make this organization
	work better.</Paragraph
>
