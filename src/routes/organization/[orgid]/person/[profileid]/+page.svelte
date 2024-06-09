<script lang="ts">
	import { page } from '$app/stores';
	import Oops from '$lib/Oops.svelte';
	import PersonView from '$lib/PersonView.svelte';
	import Title from '$lib/Title.svelte';
	import { getOrg } from '$lib/contexts';

	const org = getOrg();

	$: profile = $org.getProfileWithID($page.params.profileid);
</script>

{#if profile === null}
	<Title title="oops" kind="error" />
	<Oops text={(locale) => locale.error.noPerson} />
{:else}
	<PersonView {profile} />
{/if}
