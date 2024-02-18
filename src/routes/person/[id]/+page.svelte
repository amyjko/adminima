<script lang="ts">
	import { page } from '$app/stores';
	import Loading from '$lib/Loading.svelte';
	import Oops from '$lib/Oops.svelte';
	import database from '../../../database/Database';
	import PersonView from '$lib/PersonView.svelte';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';

	$: person = database.getPerson($page.params.id);
</script>

<!-- Not yet loaded? Show loading feedback. -->
{#if $person === undefined}
	<Loading inline={false} />
{:else if $person === null}
	<Title title="oops" kind={$locale?.term.error} />
	<Oops text={(locale) => locale.error.noPerson} />
{:else}
	<PersonView person={$person} />
{/if}
