<script lang="ts">
	import type Organization from '../types/Organization';
	import MarkupView from './MarkupView.svelte';
	import Link from './Link.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Paragraph from './Paragraph.svelte';
	import { user } from '$database/Auth';
	import { withDescription, withName } from '../types/Organization';
	import database from '$database/Database';

	export let organization: Organization;
</script>

<Title
	title={organization.name}
	kind={$locale?.term.organization}
	edit={organization.admins.includes($user.id)
		? (text) => database.updateOrganization(withName(organization, text))
		: undefined}
/>

<MarkupView
	markup={organization.description}
	edit={organization.admins.includes($user.id)
		? (text) => database.updateOrganization(withDescription(organization, text))
		: undefined}
/>

<Paragraph>
	Learn what <Link to="/organization/{organization.id}/roles">Roles</Link> people have here.</Paragraph
>

<Paragraph
	>Find all of the <Link to="/organization/{organization.id}/people">People</Link> in this organization.</Paragraph
>

<Paragraph
	>See all of the <Link to="/organization/{organization.id}/processes">Processes</Link> that make this
	organization work.</Paragraph
>

<Paragraph
	>Suggest a <Link to="/organization/{organization.id}/changes">Change</Link> to make this organization
	work better.</Paragraph
>
