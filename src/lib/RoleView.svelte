<script lang="ts">
	import type Role from '../types/Role';
	import Header from '$lib/Header.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Time from '$lib/ActivitiesView.svelte';
	import type Activity from '../types/Activity';

	export let role: Role;
	export let activities: Activity[];
</script>

<div class="scope">
	<div class="meta">
		<Header>{role.title}</Header>
		<Paragraph>{role.what}</Paragraph>
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
