<script lang="ts">
	import { page } from '$app/stores';
	import Oops from '$lib/Oops.svelte';
	import PersonView from '$lib/PersonView.svelte';
	import Title from '$lib/Title.svelte';
	import { getOrg } from '$lib/contexts';
	import { locale } from '$types/Locales';

	const org = getOrg();

	$: person = $org.getPerson($page.params.personid);
</script>

{#if person === null}
	<Title title="oops" kind={$locale?.term.error} />
	<Oops text={(locale) => locale.error.noPerson} />
{:else}
	<PersonView {person} />
{/if}
