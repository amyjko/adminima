<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import database from '../../../../../database/Database';
	import Error from '$lib/Oops.svelte';
	import { page } from '$app/stores';
	import { locale } from '../../../../../types/Locales';
	import ChangeView from '$lib/ChangeView.svelte';
	import Title from '$lib/Title.svelte';

	$: change = database.getChange($page.params.changeid);
</script>

{#if $change === undefined}
	<Loading inline={false} />
{:else if $change === null}
	<Title title="Oops" kind={$locale?.term.error} />
	<Error text={(locale) => locale.error.noChange} />
{:else}
	<ChangeView change={$change} />
{/if}
