<script lang="ts">
	import Link from './Link.svelte';
	import database from '../database/Database';
	import Loading from './Loading.svelte';
	import Oops from './Oops.svelte';
	import type { ActivityID } from '../types/Activity';
	import { getOrganizationContext } from './contexts';

	export let activityID: ActivityID;

	const organization = getOrganizationContext();

	$: activity = database.getActivity(activityID);
</script>

{#if $activity === null}<Loading />{:else if $activity === undefined}<Oops
		inline
		text={(locale) => locale.error.noActivity}
	/>{:else}<Link to="/organization/{$organization.id}/activity/{activityID}">{$activity.what}</Link
	>{/if}
