<script lang="ts">
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import type { ProfileRow } from '$database/OrganizationsDB';
	import { getOrg } from './contexts';

	export let profile: ProfileRow | null;
	export let short = false;

	const org = getOrg();
</script>

{#if profile}
	<Link to="/org/{$org?.getPath() ?? profile.orgid}/person/{profile.id}" kind="person"
		>{#if profile.name === ''}{profile.email}{:else if short}{profile.name.split(
				' '
			)[0]}{:else}{profile.name} <sub>&lt;{profile.email}&gt;</sub>{/if}</Link
	>
{:else}
	<Oops inline text={(locale) => locale.error.noPerson} />
{/if}
