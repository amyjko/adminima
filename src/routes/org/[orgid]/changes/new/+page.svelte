<script lang="ts">
	import Header from '$lib/Header.svelte';
	import Title from '$lib/Title.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Oops from '$lib/Oops.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { addError, queryOrError } from '$routes/errors.svelte';
	import Field from '$lib/Field.svelte';
	import Button from '$lib/Button.svelte';
	import Labeled from '$lib/Labeled.svelte';
	import MarkupView from '$lib/MarkupView.svelte';
	import Tip from '$lib/Tip.svelte';
	import Options from '$lib/Options.svelte';
	import { RoleItem } from '$lib/RoleLink.svelte';
	import { ProcessItem } from '$lib/ProcessLink.svelte';
	import Organization from '$database/Organization';

	const { data } = $props();

	let roles = $derived(data.roles.toSorted((a, b) => a.title.localeCompare(b.title)));
	let processes = $derived(data.processes.toSorted((a, b) => a.title.localeCompare(b.title)));

	let role = $state(page.url.searchParams.get('role') ?? undefined);
	let process = $state(page.url.searchParams.get('process') ?? undefined);

	const defaultPrompt = 'Describe the problem';

	let newRequestTitle = $state('');
	let newRequestProblem = $state('');
	let newRequestError: string | undefined = $state(undefined);

	const context = getOrg();
	const org = $derived(context.org);
	const user = getUser();
	const db = getDB();

	let isAdmin = $derived($user && context.admin);

	async function createChange() {
		if ($user === null) return;
		try {
			const { data: change, error } = await db.createChange(
				$user.id,
				org.id,
				newRequestTitle,
				newRequestProblem,
				org.visibility,
				process ? [process] : [],
				role ? [role] : []
			);
			if (error) addError("Couldn't create the change.", error);
			else if (change) {
				await goto(`/org/${Organization.getPath(org)}/change/${change.id}`);
			}
		} catch (_) {
			newRequestError = "We couldn't create the request.";
		}
	}

	let active = $derived(newRequestTitle.length > 0 && newRequestProblem.length > 0);
</script>

<Title title="New change" kind="change" />

<Header>Suggest a Change</Header>

<div class="form">
	<Field label="Title" bind:text={newRequestTitle} />
	<Labeled label={org.prompt.trim().length === 0 ? defaultPrompt : org.prompt}>
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
			view={{ snippet: RoleItem, data: roles }}
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
			bind:selection={role}
			change={(r) => {
				role = r;
				return true;
			}}
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
			view={{ snippet: ProcessItem, data: processes }}
			bind:selection={process}
			change={(p) => {
				process = p;
				return true;
			}}
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
		markup={org.prompt}
		placeholder={'No custom prompt set'}
		edit={$user
			? (text) => queryOrError(db.updateOrgPrompt(org, text, $user.id), "Couldn't update prompt")
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
