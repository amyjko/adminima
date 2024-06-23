<script lang="ts">
	import Link from './Link.svelte';
	import { getOrg } from './contexts';
	import Oops from './Oops.svelte';
	import type { TeamID } from '$types/Organization';

	export let id: TeamID;

	const org = getOrg();
	$: team = $org.getTeam(id);
</script>

{#if team === null}<Oops inline text={(locale) => locale.error.noTeam} />{:else}<Link
		to="/org/{$org.getID()}/team/{id}"
		kind="team">{team.name}</Link
	>{/if}
