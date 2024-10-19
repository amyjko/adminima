<script lang="ts">
	import Oops from '$lib/Oops.svelte';
	import { page } from '$app/stores';
	import ChangeView from '$lib/ChangeView.svelte';
	import Title from '$lib/Title.svelte';
	import { getOrg } from '$lib/contexts.svelte';

	const context = getOrg();
	let org = $derived(context.org);

	let change = $derived(org.getChange($page.params.changeid));
</script>

{#if change === null}
	<Title title="Oops" kind="change" />
	<Oops text="Couldn't find this change." />
{:else}
	<ChangeView {change} />
{/if}
