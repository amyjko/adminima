<script lang="ts">
	import RoleView from '$lib/RoleView.svelte';
	import Oops from '$lib/Oops.svelte';
	import { page } from '$app/stores';
	import { getOrg } from '$routes/+layout.svelte';

	const context = getOrg();
	let org = $derived(context.org);

	let role = $derived(
		org.getRole($page.params.roleid) ?? org.getRoleByShortName($page.params.roleid)
	);
</script>

{#if role === null}
	<Oops text="We couldn't find this role." />
{:else}
	<RoleView {role} />
{/if}
