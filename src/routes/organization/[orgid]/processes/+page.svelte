<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import database from '../../../../database/Database';
	import { getOrganizationContext } from '$lib/contexts';
	import ProcessLink from '$lib/ProcessLink.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';
	import Flow from '$lib/Flow.svelte';

	const organization = getOrganizationContext();
</script>

<Title title="processes" kind={$locale?.term.organization} />

<Paragraph
	>These are all of the processes in this organization. Select one to see how it works, who's
	responsible for it, or to suggest a change.
</Paragraph>

{#await database.getOrganizationProcesses($organization.id)}
	<Loading />
{:then processes}
	<Flow>
		{#each processes.sort((a, b) => a.what.localeCompare(b.what)) as process}
			<ProcessLink processID={process.id} />
		{/each}
	</Flow>
{/await}
