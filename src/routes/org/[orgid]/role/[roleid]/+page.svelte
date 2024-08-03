<script lang="ts">
	import RoleView from '$lib/RoleView.svelte';
	import Oops from '$lib/Oops.svelte';
	import { page } from '$app/stores';
	import { getOrg } from '$lib/contexts';

	const org = getOrg();
	$: role = $org.getRole($page.params.roleid) ?? $org.getRoleByShortName($page.params.roleid);
</script>

{#if role === null}
	<Oops text={(locale) => locale.error.noRoleProcesses} />
{:else}
	<RoleView {role} />
{/if}
