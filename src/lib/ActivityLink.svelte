<script lang="ts">
	import { onMount } from 'svelte';
	import Link from './Link.svelte';
	import database from '../database/Database';
	import Loading from './Loading.svelte';
	import Oops from './Oops.svelte';
	import type { ActivityID } from '../types/Activity';
	import type Activity from '../types/Activity';

	export let activityID: ActivityID;

	let activity: Activity | null | undefined = null;

	onMount(async () => {
		try {
			activity = await database.getActivity(activityID);
		} catch (_) {
			activity = undefined;
		}
	});
</script>

{#if activity === null}<Loading />{:else if activity === undefined}<Oops
		inline
		text={(locale) => locale.error.noActivity}
	/>{:else}<Link to="/activity/{activityID}">{activity.what}</Link>{/if}
