<script module lang="ts">
	export { TeamItem };
</script>

<script lang="ts">
	import Link from './Link.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import Oops from './Oops.svelte';
	import Self from './TeamLink.svelte';
	import type { TeamRow } from '$database/Organization';
	import Organization from '$database/Organization';

	interface Props {
		team: TeamRow | undefined;
	}

	let { team }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);
</script>

{#snippet TeamItem(team: string | undefined, teams: TeamRow[])}
	<div class="item">
		{#if team}<Self team={teams.find((t) => t.id === team)} />{:else}no team{/if}
	</div>
	<style>
		.item {
			display: inline-block;
			padding: var(--padding);
		}
	</style>
{/snippet}

{#if team === undefined}<Oops inline text="Unknown team" />{:else}<Link
		to="/org/{Organization.getPath(org)}/team/{team.id}"
		kind="team">{team.name}</Link
	>{/if}
