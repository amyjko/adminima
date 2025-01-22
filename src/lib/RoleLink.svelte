<script module lang="ts">
	export { RoleItem };
</script>

<script lang="ts">
	import type { RoleID } from '$types/Organization';
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import { getOrg } from '$routes/+layout.svelte';
	import { type Snippet } from 'svelte';
	import Self from './RoleLink.svelte';
	interface Props {
		roleID: RoleID | null;
		children?: Snippet;
	}

	let { roleID, children }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);

	let role = $derived(roleID ? org.getRole(roleID) : undefined);
	let path = $derived(role ? (role.short.length > 0 ? role.short : role.id) : undefined);
</script>

{#snippet RoleItem(role: string | undefined)}
	<div class="role-view">
		{#if role}<Self roleID={role} />{:else}—{/if}
	</div>
	<style>
		.role-view {
			display: inline-block;
			padding: var(--padding);
		}
	</style>
{/snippet}

{#if role === null}<Oops inline text="Unknown role" />{:else}<Link
		title={role !== undefined && role.short.length > 0 ? role.title : undefined}
		to={roleID ? `/org/${org.getPath()}/role/${path}` : `/org/${org.getPath()}/roles`}
		kind="role"
		>{role
			? role.short.length > 0
				? role.short[0].replace(/([A-Z]+)/g, ' $1').trim()
				: role.title
			: 'roles'}{#snippet action()}{@render children?.()}{/snippet}</Link
	>{/if}
