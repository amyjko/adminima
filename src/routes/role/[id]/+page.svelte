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
	<Page title={role.title} kind={$locale?.term.role}>
		<RoleView {role} />
	</Page>
{:catch}
	<Error text={(locale) => locale.error.noRoleActivities} />
{/await}
