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
	<Link to="/org/{$org.getPath()}/person/{profile.id}" kind="person"
		>{profile.name === '' ? profile.email : short ? profile.name.split(' ')[0] : profile.name}</Link
	>
{:else}
	<Oops inline text={(locale) => locale.error.noPerson} />
{/if}
