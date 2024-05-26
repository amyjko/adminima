<script lang="ts">
	import MarkupView from './MarkupView.svelte';
	import Link from './Link.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Paragraph from './Paragraph.svelte';
	import Organizations from '$database/Organizations';
	import type Organization from '$types/Organization';
	import { getUser } from './contexts';
	import Visibility from './Visibility.svelte';

	export let organization: Organization;

	const user = getUser();

	$: editable = $user && organization.hasAdmin($user.id);
</script>

<Title
	title={organization.getName()}
	kind={$locale?.term.organization}
	edit={editable
		? (text) => Organizations.updateOrganizationName(organization.getID(), text)
		: undefined}
>
	<Visibility level={organization.getVisibility()} />
</Title>

<MarkupView
	markup={organization.getDescription()}
	unset="No description"
	edit={editable
		? (text) => Organizations.updateDescription(organization.getID(), text)
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
