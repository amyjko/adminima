<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import ChangeForm from '$lib/ChangeForm.svelte';
	import ChangeList from '$lib/ChangeList.svelte';
	import { getOrg } from '$lib/contexts';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';

	const organization = getOrg();
</script>

<Title title="Changes" kind={$locale?.term.organization} />

<ChangeForm />

{#await $organization.getChanges()}
	<Loading />
{:then requests}
	<ChangeList changes={requests} />
{/await}
