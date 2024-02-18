<script lang="ts">
	import { user } from '$database/Auth';
	import Subheader from './Subheader.svelte';
	import { getOrganizationContext } from './contexts';

	const organization = getOrganizationContext();
</script>

<!-- Demarcates a view that is admin only, to clarify to users who has the ability to do this. -->
{#if $organization.admins.includes($user.id)}
	<Subheader warning>admins only</Subheader>
	<section class="admin">
		<slot />
	</section>
{/if}

<style>
	.admin {
		padding-left: var(--spacing);
		border-left: var(--thickness) solid var(--warning);
	}
</style>
