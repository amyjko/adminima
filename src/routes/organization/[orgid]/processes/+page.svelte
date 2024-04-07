<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import database from '../../../../database/Database';
	import { getOrganizationContext } from '$lib/contexts';
	import ProcessLink from '$lib/ProcessLink.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';
	import RoleLink from '$lib/RoleLink.svelte';
	import Level from '$lib/Level.svelte';

	const organization = getOrganizationContext();
</script>

<Title title="processes" kind={$locale?.term.organization} />

<Paragraph
	>These are all of the processes in this organization. Select one to see how it works, who's
	responsible for it, or to suggest a change.
</Paragraph>

{#await database.getOrganizationRoles($organization.id) then roles}
	{#await database.getOrganizationProcesses($organization.id)}
		<Loading />
	{:then processes}
		<table>
			<thead>
				<th>Process</th>{#each roles as role}<th class="role"><RoleLink roleID={role.id} /></th
					>{/each}
			</thead>
			<tbody>
				{#each processes.sort((a, b) => a.what.localeCompare(b.what)) as process}
					<tr>
						<td><ProcessLink processID={process.id} /></td>
						{#each roles as role}<td
								>{#if process.accountable === role.id}<Level
										level="accountable"
									/>{:else if process.responsible.includes(role.id)}<Level
										level="responsible"
									/>{/if}</td
							>{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/await}
{/await}

<style>
	td,
	th {
		vertical-align: top;
	}
</style>
