<script lang="ts">
	import type Role from '../types/Role';
	import Header from '$lib/Title.svelte';
	import Time from '$lib/ActivitiesView.svelte';
	import MarkupView from './MarkupView.svelte';
	import { parse } from '../markup/parser';
	import database from '../database/Database';
	import Error from './Oops.svelte';
	import Loading from './Loading.svelte';

	export let role: Role;
</script>

<div class="scope">
	<div class="meta">
		<MarkupView markup={parse(role.what)} />
	</div>
	{#await database.getRoleActivities(role.id)}
		<Loading />
	{:then activities}
		<Time {activities} />
	{:catch}
		<Error text={(locale) => locale.error.noRoleActivities} />
	{/await}
</div>

<style>
	.scope {
		display: flex;
		flex-direction: column;
	}
</style>
