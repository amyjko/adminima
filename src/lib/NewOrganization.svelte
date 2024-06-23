<script lang="ts">
	import { goto } from '$app/navigation';
	import Field from './Field.svelte';
	import FormDialog from './FormDialog.svelte';
	import Link from './Link.svelte';
	import Paragraph from './Paragraph.svelte';
	import { addError, getDB, getErrors, getUser } from './contexts';

	const db = getDB();
	const user = getUser();
	const errors = getErrors();

	let submitting = false;

	async function create() {
		if ($user === null || $user.email === undefined) return;
		submitting = false;

		const id = await $db.createOrganization(orgName, name, invite, $user.id, $user.email);

		if (typeof id === 'string') goto(`/org/${id}`);
		else
			addError(errors, "Couldn't create a new organization with this invite code", id ?? undefined);
	}

	let name = '';
	let orgName = '';
	let invite = '';
</script>

{#if $user === null}
	<Paragraph>
		Want to create an organization? <Link to="/login">log in</Link>.
	</Paragraph>
{:else}
	<FormDialog
		button="Create organization …"
		showTip={'Create a new organization'}
		submitTip={'Create this new organization.'}
		header="New organization"
		explanation="Let's get your name and your organization's name."
		submit="Create"
		action={create}
		valid={() => name.length > 0 && orgName.length > 0}
	>
		<Field active={!submitting} label="your name" bind:text={name} />
		<Field active={!submitting} label="organization name" bind:text={orgName} />
		<Field active={!submitting} label="invite code" bind:text={invite} />
	</FormDialog>
{/if}
