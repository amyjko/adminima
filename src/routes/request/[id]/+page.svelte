<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import database from '../../../database/Database';
	import Error from '$lib/Oops.svelte';
	import { page } from '$app/stores';
	import Page from '$lib/Page.svelte';
	import { locale } from '../../../types/Locales';
	import RequestView from '$lib/RequestView.svelte';
</script>

{#await database.getRequest($page.params.id)}
	<Loading inline={false} />
{:then request}
	{#if request}
		<Page
			title={request.title}
			kind={$locale?.term.request}
			changes={request.changes}
			organizationID={request.organization}
		>
			<RequestView {request} />
		</Page>
	{:else}
		<Error text={(locale) => locale.error.noRequest} />
	{/if}
{:catch}
	<Error text={(locale) => locale.error.noRequest} />
{/await}
