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
	<Loading />
{:then request}
	{#if request}
		<Page title={request.title} kind={$locale?.term.role} changes={request.changes}>
			<RequestView {request} />
		</Page>
	{:else}
		<Error text={(locale) => locale.error.noRequest} />
	{/if}
{:catch}
	<Error text={(locale) => locale.error.noRequest} />
{/await}
