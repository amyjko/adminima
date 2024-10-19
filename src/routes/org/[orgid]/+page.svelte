<script lang="ts">
	import OrganizationView from '$lib/OrganizationView.svelte';
	import { getOrg } from '$lib/contexts.svelte';

	const context = getOrg();
	let org = $derived(context.org);
</script>

<OrganizationView organization={org} />
