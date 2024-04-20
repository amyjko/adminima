<script lang="ts">
	import { getOrg } from '$lib/contexts';
	import ProcessLink from '$lib/ProcessLink.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';
	import RoleLink from '$lib/RoleLink.svelte';
	import Level from '$lib/Level.svelte';

	const organization = getOrg();
</script>

<Title title="processes" kind={$locale?.term.organization} visibility="org" />

<Paragraph
	>These are all of the processes in this organization. Select one to see how it works, who's
	responsible for it, or to suggest a change.
</Paragraph>

<table>
	<thead>
		<th>Process</th>{#each $organization.getRoles() as role}<th class="role"
				><RoleLink roleID={role.id} /></th
			>{/each}
	</thead>
	<tbody>
		{#each $organization.getProcesses().sort((a, b) => a.what.localeCompare(b.what)) as process}
			<tr>
				<td><ProcessLink processID={process.id} /></td>
				{#each $organization.getRoles() as role}<td
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

<style>
	td,
	th {
		vertical-align: top;
	}
</style>
