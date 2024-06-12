<script lang="ts">
	import Suggestions from '$lib/Suggestions.svelte';
	import { getOrg } from '$lib/contexts';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import Link from '$lib/Link.svelte';

	const organization = getOrg();
</script>

<Title title="Suggestions" kind="suggestion" />

<Link to="/organization/{$organization.getID()}/suggestions/new">Make a suggestion…</Link>

<Suggestions suggestions={$organization.getSuggestions()}
	><Paragraph>There are no changes suggested for this organization.</Paragraph></Suggestions
>
