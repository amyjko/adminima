<script lang="ts">
	import { onMount } from 'svelte';
	import type { PersonID } from '../types/Person';
	import Link from './Link.svelte';
	import database from '../database/Database';
	import type Person from '../types/Person';
	import Loading from './Loading.svelte';
	import Oops from './Oops.svelte';
	import type { OrganizationID } from '../types/Organization';
	import type Organization from '../types/Organization';

	export let organizationID: OrganizationID;

	let organization: Organization | null | undefined = null;

	onMount(async () => {
		organization = await database.getOrganization(organizationID);
	});
</script>

{#if organization === null}<Loading />{:else if organization === undefined}<Oops
		inline
		text={(locale) => locale.error.noOrganization}
	/>{:else}<Link to="/organization/{organizationID}">{organization.name}</Link>{/if}
