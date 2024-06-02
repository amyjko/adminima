<script lang="ts">
	import { getOrg } from '$lib/contexts';
	import ProcessLink from '$lib/ProcessLink.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';
	import RoleLink from '$lib/RoleLink.svelte';
	import Level from '$lib/Level.svelte';
	import Subheader from '$lib/Subheader.svelte';
	import type { ProcessRow, RoleRow } from '$database/Organizations';
	import type { RoleID } from '$types/Organization';
	import FormDialog from '$lib/FormDialog.svelte';
	import Field from '$lib/Field.svelte';
	import Organizations from '$database/Organizations';
	import { goto } from '$app/navigation';
	import Notice from '$lib/Notice.svelte';

	const organization = getOrg();

	function getRolesByAccountability(processes: ProcessRow[]): RoleRow[] {
		const roles: Map<RoleID, { a: number; r: number; c: number; i: number }> = new Map();

		for (const process of processes) {
			const how = $organization.getHow(process.id);
			if (how) {
				if (how.accountable && !roles.has(how.accountable)) {
					roles.set(how.accountable, { a: 0, r: 0, c: 0, i: 0 });
				}
				let tally = how.accountable ? roles.get(how.accountable) : { a: 0, r: 0, c: 0, i: 0 };
				if (tally) tally.a++;

				for (const role of how.responsible) {
					if (!roles.has(role)) roles.set(role, { a: 0, r: 0, c: 0, i: 0 });
					tally = roles.get(role);
					if (tally) tally.r++;
				}

				for (const role of how.consulted) {
					if (!roles.has(role)) {
						roles.set(role, { a: 0, r: 0, c: 0, i: 0 });
					}
					tally = roles.get(role);
					if (tally) tally.c++;
				}

				for (const role of how.informed) {
					if (!roles.has(role)) {
						roles.set(role, { a: 0, r: 0, c: 0, i: 0 });
					}
					tally = roles.get(role);
					if (tally) tally.i++;
				}
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
			.filter((r): r is RoleRow => r !== undefined);
	}

	let title = '';
	let message: string | undefined = undefined;
	async function newProcess() {
		const { error, id } = await Organizations.addProcess($organization.getID(), title);
		if (error) message = error.message;
		else goto(`/organization/${$organization.getID()}/process/${id}`);
	}
</script>

<Title title="processes" kind={$locale?.term.organization} />

<Paragraph
	>These are all of the processes in this organization. Select one to see how it works, who's
	responsible for it, or to suggest a change.
</Paragraph>

<FormDialog
	button="Create process …"
	header="New process"
	explanation="Let's give the process a name."
	submit="Create"
	action={newProcess}
	valid={() => title.length > 0}
	error={message}
>
	<Field active={true} label="title" bind:text={title} />
</FormDialog>

{#each Array.from(new Set($organization
			.getProcesses()
			.map((process) => process.concern))) as concern}
	<Subheader>{concern}</Subheader>

	{@const processes = $organization
		.getProcesses()
		.filter((p) => p.concern === concern)
		.sort((a, b) => {
			const howA = $organization.getHow(a.id);
			const howB = $organization.getHow(b.id);
			if (howA === undefined || howB === undefined) return 0;

			return (
				howB.responsible.length +
				howB.consulted.length +
				howB.informed.length -
				(howA.responsible.length + howA.consulted.length + howA.informed.length)
			);
		})}

	{@const roles = getRolesByAccountability(processes)}

	<div class="processes">
		<table>
			<thead>
				<th />{#each roles as role}<th class="role"><RoleLink roleID={role.id} /></th>{/each}
			</thead>
			<tbody>
				{#each processes as process}
					{@const how = $organization.getHow(process.id)}
					<tr>
						<td><ProcessLink processID={process.id} /></td>
						{#each roles as role}<td class="level"
								><Level
									level={how?.accountable === role.id
										? 'accountable'
										: how?.responsible.includes(role.id)
										? 'responsible'
										: how?.consulted.includes(role.id)
										? 'consulted'
										: how?.informed.includes(role.id)
										? 'informed'
										: ''}
								/></td
							>{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<Notice>This organization has no processes.</Notice>
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
