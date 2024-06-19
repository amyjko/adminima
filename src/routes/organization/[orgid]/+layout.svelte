<script lang="ts">
	import Oops from '$lib/Oops.svelte';
	import Title from '$lib/Title.svelte';
	import { OrgSymbol, getDB } from '$lib/contexts';
	import { onMount, setContext } from 'svelte';
	import { page } from '$app/stores';

	export let data;

	const db = getDB();

	// Save the payload in the database cache.
	$: if (data.payload) setContext(OrgSymbol, $db.updateOrg(data.payload));

	onMount(() => {
		// When this layout mounts, listen to realtime changes on the organization payload.
		const orgid = $page.params.orgid;
		$db.subscribe(orgid);

		return () => {
			// When this layout unmounts, unsubscribe from the organization payload.
			$db.unsubscribe(orgid);
		};
	});
</script>

{#if data.payload !== null}
	<slot />
{:else}
	<Title title="Oops" kind="organization" />
	<Oops text="Organization not found." />
{/if}
