<script module lang="ts">
	export { ProfileItem };
</script>

<script lang="ts">
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import type { ProfileRow } from '$database/OrganizationsDB';
	import { getOrg } from '$routes/+layout.svelte';
	import Self from './ProfileLink.svelte';
	import type { ProfileID } from '$types/Organization';

	interface Props {
		profile: ProfileRow | ProfileID | null;
		short?: boolean;
	}

	let { profile, short = false }: Props = $props();

	const context = getOrg();
	let org = $derived(context?.org);
	let prof = $derived(typeof profile === 'string' ? (org?.getProfile(profile) ?? null) : profile);
</script>

{#snippet ProfileItem(profile: string | undefined)}
	<div class="item">
		{#if profile}<Self {profile} />{:else}—{/if}
	</div>
	<style>
		.item {
			display: inline-block;
			padding: var(--padding);
		}
	</style>
{/snippet}

{#if prof}
	<Link to="/org/{org?.getPath() ?? prof.orgid}/person/{prof.id}" kind="person"
		>{#if prof.name === ''}{prof.email}{:else if short}{prof.name.split(' ')[0]}{:else}{prof.name}
			<sub>&lt;{prof.email}&gt;</sub>{/if}</Link
	>
{:else}
	<Oops inline text="Unknown person" />
{/if}
