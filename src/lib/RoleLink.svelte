<script lang="ts">
	import type { RoleID } from '$types/Organization';
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import { getOrg } from './contexts';

	export let roleID: RoleID;

	const org = getOrg();

	$: role = $org.getRole(roleID);
</script>

{#if role === null}<Oops inline text={(locale) => locale.error.noRole} />{:else}<Link
		to="/organization/{$org.getID()}/role/{roleID}"
		kind="role">{role.title}</Link
	>{/if}
