<script lang="ts">
	import type { RoleID } from '$types/Organization';
	import RoleLink from './RoleLink.svelte';

	export let roles: RoleID[];
</script>

{#each roles as role, index}<RoleLink
		roleID={role}
	/>{#if roles.length > 2},{/if}{#if roles.length > 1 && index === roles.length - 2}
		&nbsp;and&nbsp;
	{/if}
{/each}
<slot />
