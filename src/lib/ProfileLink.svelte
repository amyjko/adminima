<script lang="ts">
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import type { ProfileRow } from '$database/OrganizationsDB';

	export let profile: ProfileRow | null;
	export let short = false;
</script>

{#if profile}
	<Link to="/organization/{profile.orgid}/person/{profile.id}" kind="person"
		>{profile.name === '' ? profile.email : short ? profile.name.split(' ')[0] : profile.name}</Link
	>
{:else}
	<Oops inline text={(locale) => locale.error.noPerson} />
{/if}
