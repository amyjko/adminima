<script lang="ts">
	import { type TeamID } from '$types/Team';
	import Link from './Link.svelte';
	import { getOrg } from './contexts';
	import Oops from './Oops.svelte';

	export let id: TeamID;

	const org = getOrg();
	$: team = $org.getTeam(id);
</script>

{#if team === null}<Oops inline text={(locale) => locale.error.noTeam} />{:else}<Link
		to="/organization/{$org.getID()}/team/{id}"
		kind="team">{team.name}</Link
	>{/if}
