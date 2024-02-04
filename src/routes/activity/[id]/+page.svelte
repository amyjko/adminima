<script lang="ts">
	import { page } from '$app/stores';
	import Loading from '$lib/Loading.svelte';
	import Oops from '$lib/Oops.svelte';
	import database from '../../../database/Database';
	import ActivityView from '$lib/ActivityView.svelte';
	import Page from '$lib/Page.svelte';
	import { locale } from '../../../types/Locales';
</script>

{#await database.getActivity($page.params.id)}
	<Loading />
{:then activity}
	<Page
		title={activity.what}
		kind={$locale?.term.activity}
		changes={activity.changes}
		organizationID={activity.organization}
	>
		<ActivityView {activity} />
	</Page>
{:catch}
	<Oops text={(locale) => locale.error.noActivity} />
{/await}
