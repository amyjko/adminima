<script lang="ts">
	import type Role from '../types/Role';
	import Header from '$lib/Header.svelte';
	import Time from '$lib/ActivitiesView.svelte';
	import MarkupView from './MarkupView.svelte';
	import { parse } from '../markup/parser';
	import database from '../database/Database';
	import Error from './Error.svelte';
	import Loading from './Loading.svelte';

	export let role: Role;
</script>

<div class="scope">
	<div class="meta">
		<Header>{role.title}</Header>
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
		width: 100vw;
		height: 100vh;
	}

	.meta {
		padding: var(--spacing);
	}
</style>
