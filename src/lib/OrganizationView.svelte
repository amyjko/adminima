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
	import CommentsView from './CommentsView.svelte';
	import Oops from './Oops.svelte';

	export let organization: Organization;

	const user = getUser();

	$: visibility = organization.getVisibility();
	$: isAdmin = $user && organization.hasAdmin($user.id);
	$: hasUser = $user && organization.hasPerson($user.id);
	$: editable = isAdmin;
</script>

<Title
	title={organization.getName()}
	kind={$locale?.term.organization}
	edit={$user && isAdmin
		? (text) => Organizations.updateOrgName(organization, text, $user.id)
		: undefined}
>
	<Visibility
		level={organization.getVisibility()}
		edit={$user && editable
			? (vis) => Organizations.updateOrgVisibility(organization, vis, $user.id)
			: undefined}
	/>
</Title>

{#if visibility === 'public' || ($user && visibility === 'org' && hasUser) || (organization.getVisibility() === 'admin' && isAdmin)}
	<MarkupView
		markup={organization.getDescription()}
		unset="No description"
		edit={editable && $user
			? (text) => Organizations.updateOrgDescription(organization, text, $user.id)
			: undefined}
	/>

	<Paragraph>
		See the <strong>{organization.getRoles().length}</strong>
		<Link kind="role" to="/organization/{organization.getID()}/roles"
			>Role{organization.getRoles().length !== 1 ? 's' : ''}</Link
		> people have in this organization.</Paragraph
	>

	<Paragraph
		>See the <strong>{organization.getProfiles().length} </strong>
		<Link kind="person" to="/organization/{organization.getID()}/people"
			>{organization.getProfiles().length !== 1 ? 'People' : 'Person'}</Link
		> in this organization.</Paragraph
	>

	<Paragraph
		>See the <strong>{organization.getProcesses().length}</strong>
		<Link kind="process" to="/organization/{organization.getID()}/processes"
			>Process{organization.getProcesses().length !== 1 ? 'es' : ''}</Link
		>
		that make this organization work.</Paragraph
	>

	<Paragraph
		>See the <strong>{organization.getChanges().length}</strong>
		<Link kind="change" to="/organization/{organization.getID()}/changes"
			>Change{organization.getChanges().length !== 1 ? 's' : ''}</Link
		> proposed.</Paragraph
	>

	<CommentsView comments={organization.getComments()} />
{:else}
	<Oops text="This organization's details aren't visible to you." />
{/if}
