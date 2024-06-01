<script lang="ts">
	import Header from './Header.svelte';
	import { getOrg, getUser } from './contexts';

	const organization = getOrg();
	const user = getUser();
</script>

<!-- Demarcates a view that is admin only, to clarify to users who has the ability to do this. -->
{#if $user && $organization.hasAdminPerson($user.id)}
	<section class="admin">
		<Header><em>Admins only</em></Header>
		<slot />
	</section>
{/if}

<style>
	.admin {
		padding-left: var(--spacing);
		margin-top: var(--spacing);
		margin-bottom: var(--spacing);
		border-left: var(--thickness) solid var(--warning);
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
	}
</style>
