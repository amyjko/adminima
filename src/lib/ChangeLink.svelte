<script lang="ts">
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import { type ChangeID } from '../types/Change';
	import { getOrg } from './contexts';

	export let changeID: ChangeID;

	const org = getOrg();

	$: change = $org.getChange(changeID);
</script>

{#if change === null}<Oops inline text={(locale) => locale.error.noPerson} />{:else}<Link
		to="/organization/{$org.getID()}/change/{changeID}">{change.title}</Link
	>{/if}
