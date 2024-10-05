<script lang="ts">
	import type { RoleID } from '$types/Organization';
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import { getOrg } from './contexts';

	export let roleID: RoleID | null;

	const org = getOrg();

	$: role = roleID ? $org.getRole(roleID) : undefined;
	$: path = role ? (role.short.length > 0 ? role.short : role.id) : undefined;
</script>

{#if role === null}<Oops inline text={(locale) => locale.error.noRole} />{:else}<Link
		title={role !== undefined && role.short.length > 0 ? role.title : undefined}
		to={roleID ? `/org/${$org.getPath()}/role/${path}` : `/org/${$org.getPath()}/roles`}
		kind="role"
		>{role
			? role.short.length > 0
				? role.short[0].replace(/([A-Z]+)/g, ' $1').trim()
				: role.title
			: 'roles'}<slot /></Link
	>{/if}
