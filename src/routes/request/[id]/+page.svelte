<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import database from '../../../database/Database';
	import Error from '$lib/Oops.svelte';
	import { page } from '$app/stores';
	import Page from '$lib/Page.svelte';
	import { locale } from '../../../types/Locales';
	import RequestView from '$lib/RequestView.svelte';

	$: request = database.getRequest($page.params.id);
</script>

{#if $request === undefined}
	<Loading inline={false} />
{:else if $request === null}
	<Page title={'Oops'} kind={$locale?.term.error} changes={undefined} organizationID={undefined}>
		<Error text={(locale) => locale.error.noRequest} />
	</Page>
{:else}
	<Page
		title={$request.title}
		kind={$locale?.term.request}
		changes={$request.changes}
		organizationID={$request.organization}
	>
		<RequestView request={$request} />
	</Page>
{/if}
