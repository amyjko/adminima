<script module lang="ts">
	export const OrgSymbol = Symbol('organization');
	export type OrgContext = {
		org: OrganizationRow;
		admin: boolean;
		member: boolean;
		counts: {
			roles: number;
			profiles: number;
			processes: number;
			changes: number;
		};
		shortRoles: { id: string; short: string[]; title: string }[];
		shortProcesses: { id: string; short: string[]; title: string; state: string }[];
	};
	export function getOrg(): OrgContext {
		return getContext<OrgContext>(OrgSymbol);
	}
</script>

<script lang="ts">
	import { getDB } from '$routes/+layout.svelte';
	import { getContext, onMount, setContext } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { type OrganizationRow } from '$database/Organization';
	import { navigating } from '$app/state';
	import Loading from '$lib/Loading.svelte';

	let { data, children } = $props();

	let loading = $state(false);

	const db = getDB();

	// Create a state to store the current organization. We'll store this as context.
	let context: OrgContext = $derived({
		org: data.org,
		admin: data.admin,
		member: data.member,
		counts: data.counts,
		shortRoles: data.shortRoles,
		shortProcesses: data.shortProcesses
	});

	// svelte-ignore state_referenced_locally
	setContext(OrgSymbol, context);

	// When the payload changes, update the organization state and all views dependent on it.
	$effect(() => {
		context.admin = data.admin;
		context.org = data.org;
		context.member = data.member;
		context.counts = data.counts;
		context.shortRoles = data.shortRoles;
		context.shortProcesses = data.shortProcesses;
	});

	// When realtime reports revised data, and we aren't navigating, reload all data and render accordingly.
	function updateOrg() {
		if (navigating.to === null) {
			loading = true;
			invalidateAll().then(() => (loading = false));
		}
	}

	onMount(() => {
		// When this layout mounts, listen to realtime changes on the organization payload.
		const orgid = data.org.id;

		// Listen to realitime changes on the organization.
		db.listen(context.org, updateOrg);

		// When this layout unmounts, unsubscribe from the organization realitime updates.
		return () => {
			if (orgid) db.ignore(orgid, updateOrg);
		};
	});
</script>

{@render children()}
{#if loading}
	<div class="banner">
		<Loading />
	</div>
{/if}

<style>
	.banner {
		position: fixed;
		left: 0;
		right: 0;
		top: var(--spacing);
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}
</style>
