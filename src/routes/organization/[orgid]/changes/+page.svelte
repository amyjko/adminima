<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import database from '../../../../database/Database';
	import ChangeForm from '$lib/ChangeForm.svelte';
	import ChangeList from '$lib/ChangeList.svelte';
	import { getOrganizationContext } from '$lib/contexts';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';

	const organization = getOrganizationContext();
</script>

<Title title="Changes" kind={$locale?.term.organization} />

<ChangeForm organization={$organization.id} />

{#await database.getOrganizationChanges($organization.id)}
	<Loading />
{:then requests}
	<ChangeList changes={requests} />
{/await}
