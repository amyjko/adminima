<script lang="ts">
	import Link from '$lib/Link.svelte';
	import Oops from '$lib/Oops.svelte';
	import Title from '$lib/Title.svelte';
	import { OrgSymbol, getDB, getUser } from '$lib/contexts';
	import { onMount, setContext } from 'svelte';

	export let data;

	$: ({ payload } = data);

	const db = getDB();
	const user = getUser();

	// Save the payload in the database cache.
	$: org = data.payload ? $db.updateOrg(data.payload) : undefined;
	$: if (payload) setContext(OrgSymbol, org);
	onMount(() => {
		// When this layout mounts, listen to realtime changes on the organization payload.
		const orgid = data.payload?.organization.id;
		if (orgid) $db.subscribe(orgid);

		return () => {
			// When this layout unmounts, unsubscribe from the organization payload.
			if (orgid) $db.unsubscribe(orgid);
		};
	});
</script>

{#if $org}
	<slot />
{:else}
	<Title title="Oops" kind="organization" />
	<Oops
		>Organization not found. If you're expecting access, try <Link to="/login">logging in</Link> first.</Oops
	>
{/if}
