<script lang="ts">
	import type Organization from '$types/Organization';
	import { getUser } from './contexts';
	import Link from './Link.svelte';
	import OrganizationLink from './OrganizationLink.svelte';

	export let organization: Organization;

	const user = getUser();

	$: visible =
		organization.getVisibility() === 'public' ||
		($user &&
			((organization.getVisibility() === 'org' && organization.hasPerson($user.id)) ||
				(organization.getVisibility() === 'admin' && organization.hasAdminPerson($user.id))));
</script>

<div class="links">
	<span class="link">
		<OrganizationLink id={organization.getPath()} name="" />
	</span>
	<span class="link">
		<Link kind="role" to="/org/{organization.getPath()}/roles"
			><strong>{organization.getRoles().length}</strong> Role{organization.getRoles().length === 1
				? ''
				: 's'}</Link
		>
	</span>
	{#if visible}
		<span class="link">
			<Link kind="person" to="/org/{organization.getPath()}/people"
				><strong>{organization.getProfiles().length} </strong>
				{organization.getProfiles().length !== 1 ? 'People' : 'Person'}</Link
			>
		</span>
	{/if}
	<span class="link">
		<Link kind="process" to="/org/{organization.getPath()}/processes"
			><strong>{organization.getProcesses().length}</strong> Process{organization.getProcesses()
				.length !== 1
				? 'es'
				: ''}</Link
		>
	</span>
	<span class="link">
		<Link kind="change" to="/org/{organization.getPath()}/changes"
			><strong>{organization.getChanges().length}</strong> Change{organization.getChanges()
				.length !== 1
				? 's'
				: ''}</Link
		>
	</span>
</div>

<style>
	.links {
		display: flex;
		flex-direction: row;
		justify-content: start;
		gap: var(--spacing);
		font-size: var(--small-size);
	}

	.link {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: calc(var(--spacing) / 2);
	}
</style>
