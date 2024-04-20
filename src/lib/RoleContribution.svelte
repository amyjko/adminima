<script lang="ts">
	import type { RoleID } from '$types/Role';
	import RoleLink from './RoleLink.svelte';

	export let roles: RoleID[];
</script>

{#each roles as role, index}<RoleLink
		roleID={role}
	/>{#if roles.length > 1 && index < roles.length - 1}{#if roles.length > 2},{/if} and&nbsp;
	{/if}
{/each}
{#if roles.length > 1}are{:else}is{/if}
<slot />
