<script lang="ts">
	import { page } from '$app/stores';
	import Loading from '$lib/Loading.svelte';
	import Oops from '$lib/Oops.svelte';
	import database from '../../../database/Database';
	import Page from '$lib/Page.svelte';
	import { locale } from '../../../types/Locales';
	import PersonView from '$lib/PersonView.svelte';
</script>

{#await database.getPerson($page.params.id)}
	<Loading />
{:then person}
	{#if person}
		<Page title={person.name} kind={$locale?.term.person} changes={undefined}>
			<PersonView {person} />
		</Page>
	{:else}
		<Oops text={(locale) => locale.error.noPerson} />
	{/if}
{:catch}
	<Oops text={(locale) => locale.error.noPerson} />
{/await}
