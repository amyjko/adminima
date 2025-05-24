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

	let { data, children } = $props();

	const db = getDB();

	// Create a state to store the current organization. We'll store this as context.
	let context: OrgContext = $state({
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

	// When realtime has a revised org, update the context.
	function updateOrg() {
		invalidateAll();
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
