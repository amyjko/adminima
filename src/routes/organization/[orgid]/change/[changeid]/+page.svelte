<script lang="ts">
	import Error from '$lib/Oops.svelte';
	import { page } from '$app/stores';
	import { locale } from '../../../../../types/Locales';
	import ChangeView from '$lib/ChangeView.svelte';
	import Title from '$lib/Title.svelte';
	import { getOrg } from '$lib/contexts';

	const org = getOrg();

	$: change = $org.getChange($page.params.changeid);
</script>

{#if change === null}
	<Title title="Oops" kind={$locale?.term.error} visibility="org" />
	<Error text={(locale) => locale.error.noChange} />
{:else}
	<ChangeView {change} />
{/if}
