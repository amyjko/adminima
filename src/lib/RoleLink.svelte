<script lang="ts">
	import type { RoleID } from '$types/Organization';
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import { getOrg } from './contexts';

	export let roleID: RoleID | null;

	const org = getOrg();

	$: role = roleID ? $org.getRole(roleID) : undefined;
</script>

{#if role === null}<Oops inline text={(locale) => locale.error.noRole} />{:else}<Link
		to={roleID ? `/org/${$org.getPath()}/role/${roleID}` : `/org/${$org.getPath()}/roles`}
		kind="role">{role ? role.title : 'roles'}</Link
	>{/if}
