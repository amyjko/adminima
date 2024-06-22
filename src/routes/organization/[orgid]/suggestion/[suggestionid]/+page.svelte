<script lang="ts">
	import Oops from '$lib/Oops.svelte';
	import { page } from '$app/stores';
	import SuggestionView from '$lib/SuggestionView.svelte';
	import Title from '$lib/Title.svelte';
	import { getOrg } from '$lib/contexts';

	const org = getOrg();

	$: suggestion = $org.getSuggestion($page.params.suggestionid);
</script>

{#if suggestion === null}
	<Title title="Oops" kind="suggestion" />
	<Oops text="Couldn't find this suggestion." />
{:else}
	<SuggestionView {suggestion} />
{/if}
