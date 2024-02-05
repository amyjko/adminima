<script lang="ts">
	import { page } from '$app/stores';
	import Loading from '$lib/Loading.svelte';
	import Oops from '$lib/Oops.svelte';
	import database from '../../../database/Database';
	import OrganizationView from '$lib/OrganizationView.svelte';
	import Page from '$lib/Page.svelte';
	import { locale } from '../../../types/Locales';

	const organization = database.getOrganization($page.params.id);
</script>

{#if organization === undefined}
	<Loading inline={false} />
{:else if $organization}
	<Page
		title={$organization.name}
		kind={$locale?.term.organization}
		changes={$organization.changes}
		organizationID={undefined}
	>
		<OrganizationView organization={$organization} />
	</Page>
{:else}
	<Oops text={(locale) => locale.error.noOrganization} />
{/if}
