<script lang="ts">
	import Link from '$lib/Link.svelte';
	import Oops from '$lib/Oops.svelte';
	import Title from '$lib/Title.svelte';
	import { getDB, OrgSymbol } from '$routes/+layout.svelte';
	import { onMount, setContext, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import Organization from '$types/Organization';

	interface Props {
		data: LayoutData;
		children?: Snippet;
	}

	let { data, children }: Props = $props();

	const db = getDB();

	// Create a state to store the current organization. We'll store this as context.
	let context = $state({ org: data.payload ? new Organization(data.payload) : undefined });

	// svelte-ignore state_referenced_locally
	setContext(OrgSymbol, context);

	// When the payload changes, update the organization state and all views dependent on it.
	$effect(() => {
		context.org = data.payload ? new Organization(data.payload) : undefined;
	});

	// When realtime has a revised org, update the context.
	function updateOrg(payload: Organization) {
		context.org = payload;
	}

	onMount(() => {
		// When this layout mounts, listen to realtime changes on the organization payload.
		const orgid = data.payload?.organization.id;

		// Listen to realitime changes on the organization.
		if (context.org) db.listen(context.org, updateOrg);

		// When this layout unmounts, unsubscribe from the organization realitime updates.
		return () => {
			if (orgid) db.ignore(orgid, updateOrg);
		};
	});
</script>

{#if context.org}
	{@render children?.()}
{:else}
	<Title title="Oops" kind="organization" />
	<Oops
		>Organization not found. If you're expecting access, try <Link to="/login">logging in</Link> first.</Oops
	>
{/if}
