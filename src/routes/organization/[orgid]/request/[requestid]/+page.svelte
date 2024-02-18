<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import database from '../../../../../database/Database';
	import Error from '$lib/Oops.svelte';
	import { page } from '$app/stores';
	import Page from '$lib/Page.svelte';
	import { locale } from '../../../../../types/Locales';
	import RequestView from '$lib/RequestView.svelte';
	import Title from '$lib/Title.svelte';

	$: request = database.getRequest($page.params.requestid);
</script>

{#if $request === undefined}
	<Loading inline={false} />
{:else if $request === null}
	<Title title="Oops" kind={$locale?.term.error} />
	<Error text={(locale) => locale.error.noRequest} />
{:else}
	<RequestView request={$request} />
{/if}
