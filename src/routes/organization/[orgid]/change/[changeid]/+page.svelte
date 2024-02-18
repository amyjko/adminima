<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import database from '../../../../../database/Database';
	import Error from '$lib/Oops.svelte';
	import { page } from '$app/stores';
	import { locale } from '../../../../../types/Locales';
	import RequestView from '$lib/ChangeView.svelte';
	import Title from '$lib/Title.svelte';

	$: request = database.getRequest($page.params.changeid);
</script>

{#if $request === undefined}
	<Loading inline={false} />
{:else if $request === null}
	<Title title="Oops" kind={$locale?.term.error} />
	<Error text={(locale) => locale.error.noChange} />
{:else}
	<RequestView change={$request} />
{/if}
