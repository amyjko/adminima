<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import database from '../../../../database/Database';
	import Header from '$lib/Header.svelte';
	import RequestForm from '$lib/RequestForm.svelte';
	import RequestList from '$lib/RequestList.svelte';
	import { getOrganizationContext } from '$lib/contexts';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';

	const organization = getOrganizationContext();
</script>

<Title title="requests" kind={$locale?.term.organization} />

<Header>New requests</Header>

<RequestForm organization={$organization.id} />

{#await database.getOrganizationRequests($organization.id)}
	<Loading />
{:then requests}
	<RequestList {requests} />
{/await}
