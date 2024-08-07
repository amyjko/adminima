<script lang="ts">
	import { addError, getDB, getErrors, getOrg, getUser } from '$lib/contexts';
	import ProcessLink from '$lib/ProcessLink.svelte';
	import Title from '$lib/Title.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import Level from '$lib/Level.svelte';
	import type { ProcessRow, RoleRow } from '$database/OrganizationsDB';
	import type { RoleID } from '$types/Organization';
	import FormDialog from '$lib/FormDialog.svelte';
	import Field from '$lib/Field.svelte';
	import { goto } from '$app/navigation';
	import Notice from '$lib/Notice.svelte';
	import Oops from '$lib/Oops.svelte';
	import Concern from '$lib/Concern.svelte';
	import Tip from '$lib/Tip.svelte';
	import Header from '$lib/Header.svelte';
	import Table from '$lib/Table.svelte';
	import Status from '$lib/Status.svelte';

	const organization = getOrg();
	const user = getUser();
	const db = getDB();
	const errors = getErrors();

	let filter = '';
	$: lowerFilter = filter.toLocaleLowerCase().trim();

	$: personRoles = $user ? $organization.getPersonRoles($user.id) : [];

	function getRolesByAccountability(processes: ProcessRow[]): RoleRow[] {
		const roles: Map<RoleID, { a: number; r: number; c: number; i: number }> = new Map();

		for (const process of processes) {
			const hows = $organization.getProcessHows(process.id);

			if (process.accountable && !roles.has(process.accountable))
				roles.set(process.accountable, { a: 0, r: 0, c: 0, i: 0 });

			let tally = process.accountable ? roles.get(process.accountable) : { a: 0, r: 0, c: 0, i: 0 };
			if (tally) tally.a++;

			for (const how of hows) {
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
	async function newProcess() {
		const { error, id } = await $db.addProcess($organization.getID(), title);
		if (error) {
			addError(errors, "Couldn't add new process", error);
			return false;
		} else {
			goto(`/org/${$organization.getPath()}/process/${id}`);
			return true;
		}
	}
</script>

<Title title="Processes" kind="process" />

{#if ($user === null && $organization.getVisibility() !== 'public') || ($user !== null && !$organization.hasPerson($user.id))}
	<Oops text="This organization's processes are not public." />
{:else}
	<Tip member
		>These are all of the processes in this organization and which roles are involved in them.
		Select one to see how it works, who's responsible for it, or to suggest a change. Change process
		concerns in each process's page.
	</Tip>

	{#if $user && $organization.hasPerson($user.id)}
		<FormDialog
			button="Create process …"
			showTip="Create a new process."
			submitTip="Create this new process."
			header="New process"
			explanation="Let's give the process a name."
			submit="Create"
			inactive="Fill in a title."
			action={newProcess}
			valid={() => title.length > 0}
		>
			<Field active={true} label="title" bind:text={title} />
		</FormDialog>
	{/if}

	<Field label="Filter" bind:text={filter} />

	{#each Array.from(new Set($organization
				.getProcesses()
				.map((process) => process.concern))) as concern}
		<Header><Concern {concern} /></Header>

		{@const processes = $organization
			.getProcesses()
			.filter((p) => p.concern === concern)
			.filter(
				(p) =>
					lowerFilter.length === 0 ||
					p.title.toLowerCase().includes(lowerFilter) ||
					p.short.toLowerCase().includes(lowerFilter)
			)
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
			<Table>
				<thead>
					<th /><th />{#each roles as role}<th class="role" class:me={personRoles.includes(role.id)}
							><RoleLink roleID={role.id} /></th
						>{:else}<th />{/each}
				</thead>
				<tbody>
					{#each processes as process}
						{@const hows = $organization.getProcessHows(process.id)}
						<tr>
							<td><Status status={process.state} /></td>
							<td><ProcessLink processID={process.id} /></td>
							{#each roles as role}
								<td class="level" class:me={personRoles.includes(role.id)}
									><Level
										level={process?.accountable === role.id
											? 'accountable'
											: hows.some((how) => how.responsible.includes(role.id))
											? 'responsible'
											: hows.some((how) => how.consulted.includes(role.id))
											? 'consulted'
											: hows.some((how) => how.informed.includes(role.id))
											? 'informed'
											: ''}
									/></td
								>{:else}<td><em>no roles</em></td>{/each}
						</tr>
					{/each}
				</tbody>
			</Table>
		</div>
	{:else}
		<Notice>This organization has no processes.</Notice>
	{/each}
{/if}

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

	.me {
		background: var(--warning-background);
	}
</style>
