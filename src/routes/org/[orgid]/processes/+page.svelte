<script lang="ts">
	import { getOrg } from '$routes/+layout.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { addError } from '$routes/errors.svelte';
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
	import { sortProcessesByNextDate } from '$database/Period';
	import ProcessDate from '$lib/ProcessDate.svelte';
	import Visibility from '$lib/Visibility.svelte';

	const context = getOrg();
	let org = $derived(context.org);

	const user = getUser();
	const db = getDB();

	let isAdmin = $derived($user && org.hasAdminPerson($user.id));

	let visible = $derived(
		($user === null && org.getVisibility() === 'public') ||
			($user !== null && org.hasPerson($user.id))
	);

	let filter = $state('');
	let lowerFilter = $derived(filter.toLocaleLowerCase().trim());

	let personRoles = $derived($user ? org.getPersonRoles($user.id) : []);

	function getRolesByAccountability(processes: ProcessRow[]): RoleRow[] {
		const roles: Map<RoleID, { a: number; r: number; c: number; i: number }> = new Map();

		for (const process of processes) {
			const hows = org.getProcessHows(process.id);

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
			.map((id) => org.getRole(id))
			.filter((r): r is RoleRow => r !== undefined);
	}

	let title = $state('');
	async function newProcess() {
		const { error, id } = await db.addProcess(org.getID(), title, org.getVisibility());
		if (error) {
			addError("Couldn't add new process", error);
			return false;
		} else {
			goto(`/org/${org.getPath()}/process/${id}`);
			return true;
		}
	}
</script>

<Title title="Processes" kind="process" label={false} />

<Tip member
	><p>
		These are all of the processes in this organization and which roles are involved in them. Select
		one to see how it works, who's responsible for it, or to suggest a change. Change process
		concerns in each process's page.
	</p>
	<p>
		<Level level="accountable" />ccountable roles are in charge of the process's outcomes.
		<br /><Level level="responsible" />esponsible roles complete a process.
		<br /><Level level="consulted" />onsulted roles provide input, information, and guidance on a
		process.
		<br /><Level level="informed" />nformed roles are notified a process is happening and of its
		outcomes.
	</p>
</Tip>

{#if !visible}
	<Oops text="Only showing public processes of this private organization." />
{/if}

{#if $user && org.hasPerson($user.id)}
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

{#each Array.from(new Set(org.getProcesses().map((process) => process.concern))) as concern}
	<!-- Find the matching for this concern and the filter -->
	{@const processes = sortProcessesByNextDate(
		org
			.getProcesses()
			.filter((p) => p.concern === concern)
			.filter(
				(p) =>
					lowerFilter.length === 0 ||
					p.title.toLowerCase().includes(lowerFilter) ||
					p.short.some((name) => name.toLowerCase().includes(lowerFilter))
			)
			.sort((a, b) => {
				const howA = org.getHow(a.id);
				const howB = org.getHow(b.id);
				if (howA === undefined || howB === undefined) return 0;

				return (
					howB.responsible.length +
					howB.consulted.length +
					howB.informed.length -
					(howA.responsible.length + howA.consulted.length + howA.informed.length)
				);
			})
	)}

	{@const roles = getRolesByAccountability(processes)}

	<!-- If there's no filter, or there is and there are processes that match, show the concern and it's matching processes. -->
	{#if lowerFilter.length === 0 || processes.length > 0}
		<div class="concern">
			<Header
				><Concern
					{concern}
					edit={isAdmin
						? (newConcern) => db.renameConcern(org.getID(), concern, newConcern)
						: undefined}
				/></Header
			>
			<div class="processes">
				<Table>
					<thead>
						<tr
							><th>status</th><th>visibility</th><th>repeats</th><th>process</th
							>{#each roles as role}<th class="role" class:me={personRoles.includes(role.id)}
									><RoleLink roleID={role.id} /></th
								>{:else}<th></th>{/each}
						</tr>
					</thead>
					<tbody>
						{#each processes as process}
							{@const how = process.howid !== null ? org.getHow(process.howid) : undefined}
							{@const hows = org.getProcessHows(process.id)}
							<tr>
								<td><Status status={process.state} /></td>
								<td
									>{#if how}<Visibility
											tip="The visibility of tis process"
											level={how.visibility}
										/>{/if}</td
								>
								<td><ProcessDate {process} /></td>
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
		</div>
	{/if}
{:else}
	<Notice>This organization has no processes.</Notice>
{/each}

<style>
	.concern {
		width: calc(100vw - 2em);
		margin-left: calc(-1 * (100vw - 2em - 100%) / 2);
	}

	td,
	th {
		vertical-align: baseline;
		font-size: var(--small-size);
	}

	th {
		vertical-align: bottom;
	}

	.level {
		text-align: center;
		vertical-align: middle;
	}

	.role {
		writing-mode: vertical-rl;
		text-align: end;
	}

	tr:nth-child(even) {
		background-color: var(--separator);
	}

	.me {
		background: var(--warning-background);
	}
</style>
