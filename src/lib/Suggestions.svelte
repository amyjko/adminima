<script lang="ts">
	import { type SuggestionRow } from '$database/OrganizationsDB';
	import timestampToDate from '$database/timestampToDate';
	import SuggestionLink from './SuggestionLink.svelte';
	import PersonLink from './PersonLink.svelte';
	import Status from './Status.svelte';
	import { getOrg } from './contexts';
	import Tip from './Tip.svelte';

	export let suggestions: SuggestionRow[];

	const org = getOrg();
	const Levels = { triage: 0, active: 1, done: 3, backlog: 2 };
</script>

<Tip>These are suggestions people have made about how to change the organization.</Tip>

{#if suggestions.length > 0}
	<table>
		<thead>
			<tr>
				<th>status</th>
				<th>reporter</th>
				<th>title</th>
			</tr>
		</thead>
		<tbody>
			{#each suggestions
				.sort((a, b) => timestampToDate(a.when).getTime() - timestampToDate(b.when).getTime())
				.sort((a, b) => Levels[a.status] - Levels[b.status]) as suggestion}
				<tr>
					<td><Status status={suggestion.status} /></td>

					<td><PersonLink profile={$org.getProfileWithPersonID(suggestion.who)} /></td>
					<td><SuggestionLink id={suggestion.id} /></td></tr
				>
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
