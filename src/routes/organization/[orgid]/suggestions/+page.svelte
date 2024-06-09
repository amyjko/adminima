<script lang="ts">
	import ChangeForm from '$lib/SuggestionForm.svelte';
	import Suggestions from '$lib/Suggestions.svelte';
	import { getOrg } from '$lib/contexts';
	import Header from '$lib/Header.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';
	import { page } from '$app/stores';

	const organization = getOrg();

	$: role = $page.url.searchParams.get('role') ?? undefined;
	$: process = $page.url.searchParams.get('process') ?? undefined;
</script>

<Title title="Suggestions" kind={$locale?.term.organization} />

<Header>Suggest a Change</Header>

<ChangeForm {role} {process} />

<Header>Suggestions</Header>

<Suggestions suggestions={$organization.getSuggestions()}
	><Paragraph>There are no changes suggested for this organization.</Paragraph></Suggestions
>
