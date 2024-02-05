<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import RoleView from '$lib/RoleView.svelte';
	import database from '../../../database/Database';
	import Error from '$lib/Oops.svelte';
	import { page } from '$app/stores';
	import Page from '$lib/Page.svelte';
	import { locale } from '../../../types/Locales';

	$: role = database.getRole($page.params.id);
</script>

{#if $role === undefined}
	<Loading inline={false} />
{:else if $role === null}
	<Error text={(locale) => locale.error.noRoleActivities} />
{:else}
	<Page
		title={$role.title}
		kind={$locale?.term.role}
		changes={$role.changes}
		organizationID={$role.organization}
	>
		<RoleView role={$role} />
	</Page>
{/if}
