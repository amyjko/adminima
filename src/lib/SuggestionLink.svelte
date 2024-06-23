<script lang="ts">
	import type { ProcessID, RoleID, SuggestionID } from '$types/Organization';
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import { getOrg } from './contexts';

	export let id: SuggestionID | null;
	export let role: RoleID | null = null;
	export let process: ProcessID | null = null;

	const org = getOrg();

	$: change = id ? $org.getSuggestion(id) : null;
</script>

{#if id !== null && change === null}<Oops inline text="Unknown suggestion" />{:else}<Link
		kind="suggestion"
		to="/org/{$org.getID()}/{id ? 'suggestion' : 'suggestions'}/{id ?? 'new'}{role
			? `?role=${role}`
			: ''}{process ? `?process=${process}` : ''}"
		>{change ? change.what : 'Suggest a change...'}</Link
	>{/if}
