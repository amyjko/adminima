<script lang="ts">
	import { page } from '$app/stores';
	import Loading from '$lib/Loading.svelte';
	import Oops from '$lib/Oops.svelte';
	import { setOrganizationContext } from '$lib/contexts';
	import type { Writable } from 'svelte/store';
	import database from '../../../database/Database';
	import type Organization from '$types/Organization';

	// Get a store representing the organization
	const organization = database.getOrganization($page.params.orgid);
	// Store it in a context for child components to acccess.
	$: if ($organization) setOrganizationContext(organization as Writable<Organization>);
</script>

{#if $organization === undefined}
	<Loading inline={false} />
{:else if $organization === null}
	<Oops text={(locale) => locale.error.noOrganization} />
{:else}
	<slot />
{/if}
