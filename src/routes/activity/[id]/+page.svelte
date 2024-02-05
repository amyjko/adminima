<script lang="ts">
	import { page } from '$app/stores';
	import Loading from '$lib/Loading.svelte';
	import Oops from '$lib/Oops.svelte';
	import database from '../../../database/Database';
	import ActivityView from '$lib/ActivityView.svelte';
	import Page from '$lib/Page.svelte';
	import { locale } from '../../../types/Locales';

	$: activity = database.getActivity($page.params.id);
</script>

<Page
	title={$activity?.what ?? 'Oops'}
	kind={$locale?.term.activity}
	changes={$activity?.changes}
	organizationID={$activity?.organization}
>
	{#if $activity === undefined}
		<Loading inline={false} />
	{:else if $activity}
		<ActivityView activity={$activity} />
	{:else}
		<Oops text={(locale) => locale.error.noActivity} />
	{/if}
</Page>
