<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import RoleView from '$lib/RoleView.svelte';
	import database from '$database/Database';
	import Error from '$lib/Oops.svelte';
	import { page } from '$app/stores';

	$: role = database.getRole($page.params.roleid);
</script>

{#if $role === undefined}
	<Loading inline={false} />
{:else if $role === null}
	<Error text={(locale) => locale.error.noRoleProcesses} />
{:else}
	<RoleView role={$role} />
{/if}
