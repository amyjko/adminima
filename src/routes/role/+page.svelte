<script lang="ts">
	import MockActivities from '$lib/mock/activities.json?raw';
	import MockRole from '$lib/mock/role.json?raw';
	import type Role from '../../types/Role';
	import type Activity from '../../types/Activity';
	import RoleView from '$lib/RoleView.svelte';

	const role = JSON.parse(MockRole) as Role;
	const activities = JSON.parse(MockActivities) as Activity[];
</script>

<RoleView {role} {activities} />
