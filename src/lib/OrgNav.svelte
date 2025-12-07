<script lang="ts">
	import { getUser } from '$routes/+layout.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import Link from './Link.svelte';
	import OrganizationLink from './OrganizationLink.svelte';
	import Organization from '$database/Organization';

	const user = getUser();

	const org = getOrg();
	let organization = $derived(org().org);
	let admin = $derived(org().admin);
	let member = $derived(org().member);
	let counts = $derived(org().counts);

	let visible = $derived(
		organization.visibility === 'public' ||
			($user &&
				((organization.visibility === 'org' && member) ||
					(organization.visibility === 'admin' && admin)))
	);

	let path = $derived(Organization.getPath(organization));
</script>

<div class="links">
	<span class="link">
		<OrganizationLink id={path} name="" />
	</span>
	<span class="link">
		<Link bland kind="role" to="/org/{path}/roles"
			><strong>{counts.roles}</strong> Role{counts.roles === 1 ? '' : 's'}</Link
		>
	</span>
	{#if visible}
		<span class="link">
			<Link bland kind="person" to="/org/{Organization.getPath(organization)}/people"
				><strong>{counts.profiles} </strong>
				{counts.profiles !== 1 ? 'People' : 'Person'}</Link
			>
		</span>
	{/if}
	<span class="link">
		<Link bland kind="process" to="/org/{path}/processes"
			><strong>{counts.processes}</strong> Process{counts.processes !== 1 ? 'es' : ''}</Link
		>
	</span>
	<span class="link">
		<Link bland kind="change" to="/org/{path}/changes"
			><strong>{counts.changes}</strong>
			Change{counts.changes !== 1 ? 's' : ''}</Link
		>
	</span>
</div>

<style>
	.links {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
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
