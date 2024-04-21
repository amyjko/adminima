<script lang="ts">
	import { getOrg } from '$lib/contexts';
	import ProcessLink from '$lib/ProcessLink.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';
	import RoleLink from '$lib/RoleLink.svelte';
	import Level from '$lib/Level.svelte';
	import Subheader from '$lib/Subheader.svelte';
	import MarkupView from '$lib/MarkupView.svelte';
	import type Process from '$types/Process';
	import type Role from '$types/Role';
	import type { RoleID } from '$types/Role';

	const organization = getOrg();

	function getRolesByAccountability(processes: Process[]): Role[] {
		const roles: Map<RoleID, { a: number; r: number; c: number; i: number }> = new Map();

		for (const process of processes) {
			if (!roles.has(process.accountable)) {
				roles.set(process.accountable, { a: 0, r: 0, c: 0, i: 0 });
			}
			let tally = roles.get(process.accountable);
			if (tally) tally.a++;

			for (const role of process.responsible) {
				if (!roles.has(role)) roles.set(role, { a: 0, r: 0, c: 0, i: 0 });
				tally = roles.get(role);
				if (tally) tally.r++;
			}

			for (const role of process.consulted) {
				if (!roles.has(role)) {
					roles.set(role, { a: 0, r: 0, c: 0, i: 0 });
				}
				tally = roles.get(role);
				if (tally) tally.c++;
			}

			for (const role of process.informed) {
				if (!roles.has(role)) {
					roles.set(role, { a: 0, r: 0, c: 0, i: 0 });
				}
				tally = roles.get(role);
				if (tally) tally.i++;
			}
		}

		return Array.from(roles.keys())
			.sort((a, b) => {
				const ao = roles.get(a);
				const bo = roles.get(b);
				if (ao === undefined || bo === undefined) return 0;
				return (
					bo.a * 1000 +
					bo.r * 100 +
					bo.c * 10 +
					bo.i -
					(ao.a * 1000 + ao.r * 100 + ao.c * 10 + ao.i)
				);
			})
			.map((id) => $organization.getRole(id))
			.filter((r): r is Role => r !== undefined);
	}
</script>

<Title title="processes" kind={$locale?.term.organization} visibility="org" />

<Paragraph
	>These are all of the processes in this organization. Select one to see how it works, who's
	responsible for it, or to suggest a change.
</Paragraph>

{#each $organization.getOrganization().concerns as concern}
	<Subheader>{concern.name}</Subheader>
	<MarkupView markup={concern.description} />

	{@const processes = $organization
		.getProcesses()
		.filter((p) => p.concern === concern.id)
		.sort(
			(a, b) =>
				b.responsible.length +
				b.consulted.length +
				b.informed.length -
				(a.responsible.length + a.consulted.length + a.informed.length)
		)}

	{@const roles = getRolesByAccountability(processes)}

	<div class="processes">
		<table>
			<thead>
				<th />{#each roles as role}<th class="role"><RoleLink roleID={role.id} /></th>{/each}
			</thead>
			<tbody>
				{#each processes as process}
					<tr>
						<td><ProcessLink processID={process.id} /></td>
						{#each roles as role}<td class="level"
								><Level
									level={process.accountable === role.id
										? 'accountable'
										: process.responsible.includes(role.id)
										? 'responsible'
										: process.consulted.includes(role.id)
										? 'consulted'
										: process.informed.includes(role.id)
										? 'informed'
										: ''}
								/></td
							>{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/each}

<style>
	.processes {
		overflow: scroll;
	}
	td,
	th {
		vertical-align: baseline;
		font-size: var(--small-size);
	}

	.level {
		text-align: center;
		vertical-align: middle;
	}

	.role {
		writing-mode: vertical-rl;
		text-align: end;
	}

	tr:nth-child(odd) {
		background-color: var(--separator);
	}
</style>
