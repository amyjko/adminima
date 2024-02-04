<script lang="ts">
	import { onMount } from 'svelte';
	import Link from './Link.svelte';
	import database from '../database/Database';
	import Loading from './Loading.svelte';
	import Oops from './Oops.svelte';
	import type { RoleID } from '../types/Role';
	import type Role from '../types/Role';

	export let roleID: RoleID;

	let role: Role | null | undefined = null;

	onMount(async () => {
		try {
			role = await database.getRole(roleID);
		} catch (_) {
			role = undefined;
		}
	});
</script>

{#if role === null}<Loading />{:else if role === undefined}<Oops
		inline
		text={(locale) => locale.error.noRole}
	/>{:else}<Link to="/role/{roleID}">{role.title}</Link>{/if}
