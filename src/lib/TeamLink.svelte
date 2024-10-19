<script lang="ts">
	import Link from './Link.svelte';
	import { getOrg } from './contexts.svelte';
	import Oops from './Oops.svelte';
	import type { TeamID } from '$types/Organization';

	interface Props {
		id: TeamID;
	}

	let { id }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);

	let team = $derived(org.getTeam(id));
</script>

{#if team === null}<Oops inline text={(locale) => locale.error.noTeam} />{:else}<Link
		to="/org/{org.getPath()}/team/{id}"
		kind="team">{team.name}</Link
	>{/if}
