<script module lang="ts">
	export { RoleItem };
</script>

<script lang="ts">
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import { type Snippet } from 'svelte';
	import Self from './RoleLink.svelte';
	import type { RoleRow } from '$database/Organization';
	import Organization, { type RoleID } from '$database/Organization';
	interface Props {
		/** Undefined means not found, null means link to all roles */
		role: { id: RoleID; title: string; short: string[] } | null | undefined;
		children?: Snippet;
	}

	let { role, children }: Props = $props();

	const context = getOrg();
	let org = $derived(context().org);

	let path = $derived(role ? (role.short.length > 0 ? role.short : role.id) : undefined);
</script>

{#snippet RoleItem(role: string | undefined, roles: RoleRow[])}
	<div class="role-view">
		{#if role}<Self role={roles.find((r) => r.id === role)} />{:else}—{/if}
	</div>
	<style>
		.role-view {
			display: inline-block;
			padding: var(--padding);
		}
	</style>
{/snippet}

{#if role === undefined}<Oops inline text="Unknown role" />{:else}<Link
		title={role !== null ? role.title : undefined}
		to={role
			? `/org/${Organization.getPath(org)}/role/${path}`
			: `/org/${Organization.getPath(org)}/roles`}
		kind="role"
		>{role ? role.title : 'roles'}{#snippet action()}{@render children?.()}{/snippet}</Link
	>{/if}
