<script lang="ts">
	import type { RoleID } from '$types/Organization';
	import RoleLink from './RoleLink.svelte';

	interface Props {
		roles: RoleID[];
		children?: import('svelte').Snippet;
	}

	let { roles, children }: Props = $props();
</script>

{#each roles as role, index}<RoleLink
		roleID={role}
	/>{#if roles.length > 2},{/if}{#if roles.length > 1 && index === roles.length - 2}
		&nbsp;and&nbsp;
	{/if}
{/each}
{@render children?.()}
