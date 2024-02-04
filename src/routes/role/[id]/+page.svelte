<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import RoleView from '$lib/RoleView.svelte';
	import database from '../../../database/Database';
	import Error from '$lib/Oops.svelte';
	import { page } from '$app/stores';
	import Page from '$lib/Page.svelte';
	import { locale } from '../../../types/Locales';
</script>

{#await database.getRole($page.params.id)}
	<Loading />
{:then role}
	{#if role}
		<Page
			title={role.title}
			kind={$locale?.term.role}
			changes={role.changes}
			organizationID={role.organization}
		>
			<RoleView {role} />
		</Page>
	{:else}
		<Error text={(locale) => locale.error.noRoleActivities} />
	{/if}
{:catch}
	<Error text={(locale) => locale.error.noRoleActivities} />
{/await}
