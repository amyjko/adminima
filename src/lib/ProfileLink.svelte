<script module lang="ts">
	export { ProfileItem };
</script>

<script lang="ts">
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import type { OrganizationRow, ProfileRow } from '#database/Organization.ts';
	import { getOrg } from '#routes/org/[orgid]/+layout.svelte';
	import Self from './ProfileLink.svelte';
	import Organization from '#database/Organization.ts';

	interface Props {
		profile: ProfileRow | undefined;
		short?: boolean;
	}

	let { profile, short = false }: Props = $props();

	// There is no organization context outside of an organization's pages, such as a person's own page.
	const context = getOrg();
	let org: OrganizationRow | undefined = $derived(context ? context().org : undefined);
</script>

{#snippet ProfileItem(profile: string | undefined, profiles: ProfileRow[])}
	<div class="item">
		{#if profile}<Self profile={profiles.find((p) => p.id === profile)} />{:else}—{/if}
	</div>
	<style>
		.item {
			display: inline-block;
		}
	</style>
{/snippet}

{#if profile}
	<Link
		to="/org/{org ? Organization.getPath(org) : profile.orgid}/person/{profile.id}"
		kind="person"
		>{#if profile.name === ''}{profile.email}{:else if short}{profile.name.split(
				' '
			)[0]}{:else}{profile.name}
			<sub>&lt;{profile.email}&gt;</sub>{/if}</Link
	>
{:else}
	<Oops inline text="Unknown person" />
{/if}
