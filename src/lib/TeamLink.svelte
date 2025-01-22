<script module lang="ts">
	export { TeamItem };
</script>

<script lang="ts">
	import Link from './Link.svelte';
	import { getOrg } from '$routes/+layout.svelte';
	import Oops from './Oops.svelte';
	import type { TeamID } from '$types/Organization';
	import Self from './TeamLink.svelte';

	interface Props {
		id: TeamID;
	}

	let { id }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);

	let team = $derived(org.getTeam(id));
</script>

{#snippet TeamItem(team: string | undefined)}
	<div class="item">
		{#if team}<Self id={team} />{:else}no team{/if}
	</div>
	<style>
		.item {
			display: inline-block;
			padding: var(--padding);
		}
	</style>
{/snippet}

{#if team === null}<Oops inline text="Unknown team" />{:else}<Link
		to="/org/{org.getPath()}/team/{id}"
		kind="team">{team.name}</Link
	>{/if}
