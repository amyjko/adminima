<script lang="ts">
	import type { OrgPayload } from '$database/Database';
	import Database from '$database/Database';
	import Oops from '$lib/Oops.svelte';
	import { OrgSymbol } from '$lib/contexts';
	import { setContext } from 'svelte';

	export let data: { payload: OrgPayload | null };

	// Save the payload in the database cache.
	$: if (data.payload) setContext(OrgSymbol, Database.updateOrg(data.payload));
</script>

{#if data.payload !== null}
	<slot />
{:else}
	<Oops text="Organization not found." />
{/if}
