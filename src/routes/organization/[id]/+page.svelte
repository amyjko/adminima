<script lang="ts">
	import { page } from '$app/stores';
	import Loading from '$lib/Loading.svelte';
	import Oops from '$lib/Oops.svelte';
	import database from '../../../database/Database';
	import OrganizationView from '$lib/OrganizationView.svelte';
	import Page from '$lib/Page.svelte';
	import { locale } from '../../../types/Locales';
</script>

{#await database.getOrganization($page.params.id)}
	<Loading />
{:then organization}
	{#if organization}
		<Page
			title={organization.name}
			kind={$locale?.term.organization}
			changes={organization.changes}
		>
			<OrganizationView {organization} />
		</Page>
	{:else}
		<Oops text={(locale) => locale.error.noOrganization} />
	{/if}
{:catch}
	<Oops text={(locale) => locale.error.noOrganization} />
{/await}
