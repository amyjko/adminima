<script lang="ts">
	import Error from '$lib/Oops.svelte';
	import { page } from '$app/stores';
	import { locale } from '$types/Locales';
	import SuggestionView from '$lib/SuggestionView.svelte';
	import Title from '$lib/Title.svelte';
	import { getOrg } from '$lib/contexts';

	const org = getOrg();

	$: suggestion = $org.getSuggestion($page.params.suggestionid);
</script>

{#if suggestion === null}
	<Title title="Oops" kind={$locale?.term.error} />
	<Error text={(locale) => locale.error.noSuggestion} />
{:else}
	<SuggestionView {suggestion} />
{/if}
