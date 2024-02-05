<script lang="ts">
	import { page } from '$app/stores';
	import Loading from '$lib/Loading.svelte';
	import Oops from '$lib/Oops.svelte';
	import database from '../../../database/Database';
	import Page from '$lib/Page.svelte';
	import { locale } from '../../../types/Locales';
	import PersonView from '$lib/PersonView.svelte';

	$: person = database.getPerson($page.params.id);
</script>

{#if $person === undefined}
	<Loading inline={false} />
{:else if $person === null}
	<Page title="Oops" kind={$locale?.term.error} changes={undefined} organizationID={undefined}>
		<Oops text={(locale) => locale.error.noPerson} />
	</Page>
{:else}
	<Page
		title={$person.name}
		kind={$locale?.term.person}
		changes={undefined}
		organizationID={undefined}
	>
		<PersonView person={$person} />
	</Page>
{/if}
