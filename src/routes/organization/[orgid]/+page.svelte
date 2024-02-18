<script lang="ts">
	import OrganizationView from '$lib/OrganizationView.svelte';
	import { getOrganizationContext } from '$lib/contexts';

	const organization = getOrganizationContext();
</script>

<OrganizationView organization={$organization} />
