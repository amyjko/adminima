<script lang="ts">
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import type { ProfileRow } from '$database/OrganizationsDB';
	import { getOrg } from './contexts.svelte';

	interface Props {
		profile: ProfileRow | null;
		short?: boolean;
	}

	let { profile, short = false }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);
</script>

{#if profile}
	<Link to="/org/{org?.getPath() ?? profile.orgid}/person/{profile.id}" kind="person"
		>{#if profile.name === ''}{profile.email}{:else if short}{profile.name.split(
				' '
			)[0]}{:else}{profile.name} <sub>&lt;{profile.email}&gt;</sub>{/if}</Link
	>
{:else}
	<Oops inline text="Unknown person" />
{/if}
