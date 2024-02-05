<script lang="ts">
	import Link from './Link.svelte';
	import database from '../database/Database';
	import Loading from './Loading.svelte';
	import Oops from './Oops.svelte';
	import type { OrganizationID } from '../types/Organization';

	export let organizationID: OrganizationID;

	let organization = database.getOrganization(organizationID);
</script>

{#if $organization === null}<Loading />{:else if $organization === undefined}<Oops
		inline
		text={(locale) => locale.error.noOrganization}
	/>{:else}<Link to="/organization/{organizationID}">{$organization.name}</Link>{/if}
