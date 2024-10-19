<script lang="ts">
	import { page } from '$app/stores';
	import Oops from '$lib/Oops.svelte';
	import ProfileView from '$lib/ProfileView.svelte';
	import Title from '$lib/Title.svelte';
	import { getOrg } from '$lib/contexts.svelte';

	const context = getOrg();
	let org = $derived(context.org);

	let profile = $derived(org.getProfileWithID($page.params.profileid));
</script>

{#if profile === null}
	<Title title="oops" kind="error" />
	<Oops text={(locale) => locale.error.noPerson} />
{:else}
	<ProfileView {profile} />
{/if}
