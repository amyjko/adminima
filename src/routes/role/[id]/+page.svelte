<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import RoleView from '$lib/RoleView.svelte';
	import database from '../../../database/Database';
	import Error from '$lib/Error.svelte';
	import { page } from '$app/stores';
</script>

{#await database.getRole($page.params.id)}
	<Loading />
{:then role}
	<RoleView {role} />
{:catch}
	<Error text={(locale) => locale.error.noRoleActivities} />
{/await}
