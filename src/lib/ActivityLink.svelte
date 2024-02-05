<script lang="ts">
	import Link from './Link.svelte';
	import database from '../database/Database';
	import Loading from './Loading.svelte';
	import Oops from './Oops.svelte';
	import type { ActivityID } from '../types/Activity';

	export let activityID: ActivityID;

	$: activity = database.getActivity(activityID);
</script>

{#if $activity === null}<Loading />{:else if $activity === undefined}<Oops
		inline
		text={(locale) => locale.error.noActivity}
	/>{:else}<Link to="/activity/{activityID}">{$activity.what}</Link>{/if}
