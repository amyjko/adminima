<script lang="ts">
	import { onMount } from 'svelte';
	import Link from './Link.svelte';
	import database from '../database/Database';
	import Loading from './Loading.svelte';
	import Oops from './Oops.svelte';
	import type { OrganizationID } from '../types/Organization';
	import type Organization from '../types/Organization';

	export let organizationID: OrganizationID;

	let organization: Organization | null | undefined = null;

	onMount(async () => {
		try {
			organization = await database.getOrganization(organizationID);
		} catch (_) {
			organization = undefined;
		}
	});
</script>

{#if organization === null}<Loading />{:else if organization === undefined}<Oops
		inline
		text={(locale) => locale.error.noOrganization}
	/>{:else}<Link to="/organization/{organizationID}">{organization.name}</Link>{/if}
