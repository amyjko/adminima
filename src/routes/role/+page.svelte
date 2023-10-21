<script lang="ts">
	import Header from '$lib/Header.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Time from '$lib/Time.svelte';

	import MockActivities from '$lib/mock/activities.json?raw';
	import MockRole from '$lib/mock/role.json?raw';
	import type Role from '../../types/Role';
	import type Activity from '../../types/Activity';

	const role = JSON.parse(MockRole) as Role;
	const activities = JSON.parse(MockActivities) as Activity[];
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
