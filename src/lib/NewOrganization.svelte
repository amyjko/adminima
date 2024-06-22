<script lang="ts">
	import { goto } from '$app/navigation';
	import Field from './Field.svelte';
	import FormDialog from './FormDialog.svelte';
	import { addError, getDB, getErrors, getUser } from './contexts';

	const db = getDB();
	const user = getUser();
	const errors = getErrors();

	let submitting = false;

	async function create() {
		if ($user === null || $user.email === undefined) return;
		submitting = false;

		const { error, id } = await $db.createOrganization(orgName, $user.id, $user.email, name);

		if (error) addError(errors, "Couldn't create a new organization", error);
		else goto(`/organization/${id}`);
	}

	let name = '';
	let orgName = '';
</script>

<FormDialog
	button="Create organization …"
	showTip={'Create a new organization'}
	submitTip={'Create this new organization.'}
	header="New organization"
	explanation="We need a few things"
	submit="Create"
	action={create}
	valid={() => name.length > 0 && orgName.length > 0}
	error={undefined}
>
	<Field active={!submitting} label="your name" bind:text={name} />
	<Field active={!submitting} label="organization name" bind:text={orgName} />
</FormDialog>
