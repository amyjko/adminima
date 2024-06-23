<script lang="ts">
	import OrganizationView from '$lib/OrganizationView.svelte';
	import { getOrg } from '$lib/contexts';

	const organization = getOrg();
</script>

<OrganizationView organization={$organization} />
