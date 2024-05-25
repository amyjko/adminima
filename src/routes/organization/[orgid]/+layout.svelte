<script lang="ts">
	import Organizations from '$database/Organizations.js';
	import Oops from '$lib/Oops.svelte';
	import Title from '$lib/Title.svelte';
	import { OrgSymbol } from '$lib/contexts';
	import { onMount, setContext } from 'svelte';
	import { page } from '$app/stores';

	export let data;

	// Save the payload in the database cache.
	$: if (data.payload) setContext(OrgSymbol, Organizations.updateOrg(data.payload));

	onMount(() => {
		// When this layout mounts, listen to realtime changes on the organization payload.
		const orgid = $page.params.orgid;
		Organizations.subscribe(orgid);

		return () => {
			// When this layout unmounts, unsubscribe from the organization payload.
			Organizations.unsubscribe(orgid);
		};
	});
</script>

{#if data.payload !== null}
	<slot />
{:else}
	<Title title="Oops" kind="organization" visibility={null} />
	<Oops text="Organization not found." />
{/if}
