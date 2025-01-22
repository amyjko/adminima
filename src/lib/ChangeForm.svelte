<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import Oops from './Oops.svelte';
	import { getOrg } from '$routes/+layout.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { addError, queryOrError } from '$routes/errors.svelte';
	import type { ProcessID, RoleID } from '$types/Organization';
	import Field from './Field.svelte';
	import Button from './Button.svelte';
	import Labeled from './Labeled.svelte';
	import MarkupView from './MarkupView.svelte';
	import Tip from './Tip.svelte';
	import Options from './Options.svelte';
	import { RoleItem } from './RoleLink.svelte';
	import { ProcessItem } from './ProcessLink.svelte';

	interface Props {
		process?: ProcessID | undefined;
		role?: RoleID | undefined;
	}

	let { process = $bindable(undefined), role = $bindable(undefined) }: Props = $props();

	const defaultPrompt = 'Describe the problem';

	let newRequestTitle = $state('');
	let newRequestProblem = $state('');
	let newRequestError: string | undefined = $state(undefined);

	const organization = getOrg();
	const user = getUser();
	const db = getDB();

	let isAdmin = $derived($user && organization.org.hasAdminPerson($user.id));

	async function createChange() {
		if ($user === null) return;
		try {
			const { data: change, error } = await db.createChange(
				$user.id,
				organization.org.getID(),
				newRequestTitle,
				newRequestProblem,
				organization.org.getVisibility(),
				process ? [process] : [],
				role ? [role] : []
			);
			if (error) addError("Couldn't create the change.", error);
			else if (change) {
				const newChange = `/org/${organization.org.getPath()}/change/${change.id}`;
				await invalidate(newChange);
				goto(newChange);
			}
		} catch (_) {
			newRequestError = "We couldn't create the request.";
		}
	}

	let active = $derived(newRequestTitle.length > 0 && newRequestProblem.length > 0);

	let roles = $derived(
		organization.org.getRoles().toSorted((a, b) => a.title.localeCompare(b.title))
	);

	let processes = $derived(
		organization.org.getProcesses().toSorted((a, b) => a.title.localeCompare(b.title))
	);
</script>

<div class="form">
	<Field label="Title" bind:text={newRequestTitle} />
	<Labeled
		label={organization.org.getPrompt().trim().length === 0
			? defaultPrompt
			: organization.org.getPrompt()}
	>
		<MarkupView
			bind:markup={newRequestProblem}
			editing
			placeholder="Detail your change suggestion"
		/>
	</Labeled>

	<Labeled label="Affected Roles">
		<Options
			id="affected-role"
			tip="Add a role that is affected by this suggestion."
			view={RoleItem}
			options={[
				undefined,
				...roles.map((role) => {
					return role.id;
				})
			]}
			searchable={{
				placeholder: 'role',
				include: (item, query) =>
					roles
						.find((r) => r.id === item)
						?.title.toLowerCase()
						.includes(query.toLowerCase()) === true
			}}
			selection={role}
			change={(r) => (role = r)}
		/>
	</Labeled>
	<Labeled label="Affected Processes">
		<Options
			id="affected-process"
			tip="Add a process that is affected by this suggestion."
			options={[undefined, ...processes.map((process) => process.id)]}
			searchable={{
				placeholder: 'process',
				include: (item: string, query: string) =>
					processes
						.find((s) => s.id === item)
						?.title.toLowerCase()
						.includes(query.toLowerCase()) === true
			}}
			view={ProcessItem}
			selection={process}
			change={(p) => (process = p)}
		/>
	</Labeled>

	<Button tip="Submit the suggestion." end {active} action={createChange}>create</Button>
</div>

{#if newRequestError}
	<Oops text={newRequestError} />
{/if}

{#if isAdmin}
	<hr />
	<Tip admin>Want to customize the prompt above?</Tip>
	<MarkupView
		markup={organization.org.getPrompt()}
		placeholder={'No custom prompt set'}
		edit={$user
			? (text) =>
					queryOrError(
						db.updateOrgPrompt(organization.org, text, $user.id),
						"Couldn't update prompt"
					)
			: undefined}
	/>
{/if}

<style>
	.form {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
	}
</style>
