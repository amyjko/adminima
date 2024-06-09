<script lang="ts">
	import type { SuggestionID } from '$types/Organization';
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import { getOrg } from './contexts';

	export let changeID: SuggestionID;

	const org = getOrg();

	$: change = $org.getSuggestion(changeID);
</script>

{#if change === null}<Oops inline text={(locale) => locale.error.noPerson} />{:else}<Link
		to="/organization/{$org.getID()}/suggestion/{changeID}">{change.what}</Link
	>{/if}
