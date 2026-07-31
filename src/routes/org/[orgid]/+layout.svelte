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
	export function getOrg(): () => OrgContext {
		return getContext<() => OrgContext>(OrgSymbol);
	}
</script>

<script lang="ts">
	import { getDB } from '$routes/+layout.svelte';
	import { getContext, onMount, setContext } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { type OrganizationRow, type RealtimeStatus } from '$database/Organization';
	import { navigating } from '$app/state';
	import Loading from '$lib/Loading.svelte';
	import Button from '$lib/Button.svelte';

	let { data, children } = $props();

	let loading = $state(false);

	/** How live updates for this organization are doing. Only 'disconnected' is worth showing. */
	let realtime = $state<RealtimeStatus>('connecting');

	const dbContext = getDB();
	const db = $derived(dbContext());

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
	setContext(OrgSymbol, () => context);

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

		// Listen to realitime changes on the organization, tracking the connection so we can say
		// when it's gone for good.
		db.listen(context.org, updateOrg, (status) => (realtime = status));

		/**
		 * Connections often die while a tab sits in the background. Rather than wait out the retry
		 * schedule when someone comes back to it, try again immediately.
		 */
		function retry() {
			if (document.visibilityState === 'visible') db.reconnect(orgid, { reset: true });
		}

		document.addEventListener('visibilitychange', retry);
		window.addEventListener('online', retry);

		// When this layout unmounts, unsubscribe from the organization realitime updates.
		return () => {
			document.removeEventListener('visibilitychange', retry);
			window.removeEventListener('online', retry);
			if (orgid) db.ignore(orgid, updateOrg);
		};
	});
</script>

{@render children()}
{#if loading || realtime === 'disconnected'}
	<div class="banner">
		{#if loading}<Loading />{/if}
		{#if realtime === 'disconnected'}
			<div class="stale">
				<span>This page is out of date.</span>
				<Button tip="Reload this page to see the latest changes" action={() => location.reload()}
					>Reload</Button
				>
			</div>
		{/if}
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
		gap: var(--spacing);
	}

	.stale {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--spacing);
		background: var(--error);
		color: var(--background);
		padding: calc(2 * var(--padding));
		border-radius: var(--radius);
		border: 1px solid var(--border);
	}
</style>
