<script lang="ts">
	import type Role from '../types/Role';
	import Header from '$lib/Header.svelte';
	import Time from '$lib/ActivitiesView.svelte';
	import type Activity from '../types/Activity';
	import MarkupView from './MarkupView.svelte';
	import { parse } from '../markup/parser';

	export let role: Role;
	export let activities: Activity[];
</script>

<div class="scope">
	<div class="meta">
		<Header>{role.title}</Header>
		<MarkupView markup={parse(role.what)} />
	</div>
	<Time {activities} />
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
