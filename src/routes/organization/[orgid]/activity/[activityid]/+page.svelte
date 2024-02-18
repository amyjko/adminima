<script lang="ts">
	import { page } from '$app/stores';
	import Loading from '$lib/Loading.svelte';
	import Oops from '$lib/Oops.svelte';
	import database from '../../../../../database/Database';
	import ActivityView from '$lib/ActivityView.svelte';

	$: activity = database.getActivity($page.params.activityid);
</script>

{#if $activity === undefined}
	<Loading inline={false} />
{:else if $activity}
	<ActivityView activity={$activity} />
{:else}
	<Oops text={(locale) => locale.error.noActivity} />
{/if}
