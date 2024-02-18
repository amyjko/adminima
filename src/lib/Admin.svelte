<script lang="ts">
	import { user } from '$database/Auth';
	import Header from './Header.svelte';
	import { getOrganizationContext } from './contexts';

	const organization = getOrganizationContext();
</script>

<!-- Demarcates a view that is admin only, to clarify to users who has the ability to do this. -->
{#if $organization.admins.includes($user.id)}
	<section class="admin">
		<Header>admins only</Header>
		<slot />
	</section>
{/if}

<style>
	.admin {
		background: var(--warning-background);
		padding: var(--spacing);
		margin-top: var(--spacing);
		margin-bottom: var(--spacing);
		border-left: var(--thickness) solid var(--warning);
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
	}
</style>
