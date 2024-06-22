<script lang="ts">
	import { type SuggestionRow } from '$database/OrganizationsDB';
	import timestampToDate from '$database/timestampToDate';
	import SuggestionLink from './SuggestionLink.svelte';
	import PersonLink from './PersonLink.svelte';
	import Status from './Status.svelte';
	import { getOrg } from './contexts';

	export let suggestions: SuggestionRow[];

	const org = getOrg();
	const Levels = { triage: 0, active: 1, done: 3, backlog: 2 };
</script>

{#if suggestions.length > 0}
	<table>
		<thead>
			<tr>
				<th>reporter</th>
				<th>title</th>
				<th>status</th>
			</tr>
		</thead>
		<tbody>
			{#each suggestions
				.sort((a, b) => timestampToDate(a.when).getTime() - timestampToDate(b.when).getTime())
				.sort((a, b) => Levels[a.status] - Levels[b.status]) as suggestion}
				<tr>
					<td><PersonLink profile={$org.getProfileWithPersonID(suggestion.who)} /></td>
					<td><SuggestionLink id={suggestion.id} /></td><td
						><Status status={suggestion.status} /></td
					>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<slot />
{/if}

<style>
	table {
		border-collapse: collapse;
		padding: var(--padding);
	}
</style>
