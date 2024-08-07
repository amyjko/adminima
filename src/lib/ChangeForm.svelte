<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import Oops from './Oops.svelte';
	import { addError, getDB, getErrors, getOrg, getUser, queryOrError } from './contexts';
	import type { ProcessID, RoleID } from '$types/Organization';
	import Field from './Field.svelte';
	import Button from './Button.svelte';
	import Labeled from './Labeled.svelte';
	import MarkupView from './MarkupView.svelte';
	import Tip from './Tip.svelte';
	import Select from './Select.svelte';

	export let process: ProcessID | undefined = undefined;
	export let role: RoleID | undefined = undefined;

	const defaultPrompt = 'Describe the problem';

	let newRequestTitle = '';
	let newRequestProblem = '';
	let newRequestError: string | undefined = undefined;

	const organization = getOrg();
	const user = getUser();
	const db = getDB();
	const errors = getErrors();

	$: isAdmin = $user && $organization.hasAdminPerson($user.id);

	async function createChange() {
		if ($user === null) return;
		try {
			const { data: change, error } = await $db.createChange(
				$user.id,
				$organization.getID(),
				newRequestTitle,
				newRequestProblem,
				$organization.getVisibility(),
				process ? [process] : [],
				role ? [role] : []
			);
			if (error) addError(errors, "Couldn't create the change.", error);
			else if (change) {
				const newChange = `/org/${$organization.getPath()}/change/${change.id}`;
				await invalidate(newChange);
				goto(newChange);
			}
		} catch (_) {
			newRequestError = "We couldn't create the request.";
		}
	}

	$: active = newRequestTitle.length > 0 && newRequestProblem.length > 0;
</script>

<div class="form">
	<Field label="Title" bind:text={newRequestTitle} />
	<Labeled
		label={$organization.getPrompt().trim().length === 0
			? defaultPrompt
			: $organization.getPrompt()}
	>
		<MarkupView
			bind:markup={newRequestProblem}
			editing
			placeholder="Detail your change suggestion"
		/>
	</Labeled>

	<Labeled label="Affected Roles">
		<Select
			tip="Add a role that is affected by this suggestion."
			options={[
				{ value: undefined, label: '—' },
				...$organization
					.getRoles()
					.toSorted((a, b) => a.title.localeCompare(b.title))
					.map((role) => {
						return { value: role.id, label: role.title };
					})
			]}
			selection={role}
			change={(r) => (role = r)}
		/>
	</Labeled>
	<Labeled label="Affected Processes">
		<Select
			tip="Add a process that is affected by this suggestion."
			options={[
				{ value: undefined, label: '—' },
				...$organization
					.getProcesses()
					.toSorted((a, b) => a.title.localeCompare(b.title))
					.map((process) => {
						return { value: process.id, label: process.title };
					})
			]}
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
		markup={$organization.getPrompt()}
		placeholder={'No custom prompt set'}
		edit={$user
			? (text) =>
					queryOrError(
						errors,
						$db.updateOrgPrompt($organization, text, $user.id),
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
