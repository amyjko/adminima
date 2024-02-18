<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import database from '../../../../database/Database';
	import Header from '$lib/Header.svelte';
	import { getOrganizationContext } from '$lib/contexts';
	import ActivityLink from '$lib/ActivityLink.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';

	const organization = getOrganizationContext();
</script>

<Title title="requests" kind={$locale?.term.organization} />

<Header>Activities</Header>

<Paragraph>All activities in this organization, independent of role.</Paragraph>

{#await database.getOrganizationActivities($organization.id)}
	<Loading />
{:then activities}
	<ul>
		{#each activities.sort((a, b) => a.what.localeCompare(b.what)) as activity}
			<li><ActivityLink activityID={activity.id} /></li>
		{/each}
	</ul>
{/await}
