<script lang="ts">
	import { page } from '$app/stores';
	import Oops from '$lib/Oops.svelte';
	import PersonView from '$lib/PersonView.svelte';
	import Title from '$lib/Title.svelte';
	import { getOrg } from '$lib/contexts';
	import { locale } from '$types/Locales';

	const org = getOrg();

	$: profile = $org.getProfile($page.params.personid);
</script>

{#if profile === null}
	<Title title="oops" kind={$locale?.term.error} visibility="org" />
	<Oops text={(locale) => locale.error.noPerson} />
{:else}
	<PersonView {profile} />
{/if}
