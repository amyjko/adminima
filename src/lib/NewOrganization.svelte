<script lang="ts">
	import { goto } from '$app/navigation';
	import Field from './Field.svelte';
	import FormDialog from './FormDialog.svelte';
	import Link from './Link.svelte';
	import Paragraph from './Paragraph.svelte';
	import { getUser } from '$routes/+layout.svelte';
	import { addError } from '$routes/errors.svelte';
	import { getDB } from '$routes/+layout.svelte';

	const db = getDB();
	const user = getUser();

	let submitting = $state(false);

	async function create() {
		if ($user === null || $user.email === undefined) {
			addError("You're not logged in.");
			return false;
		}
		submitting = false;

		const id = await db.createOrganization(orgName, name, invite, $user.id, $user.email);

		if (typeof id === 'string') {
			goto(`/org/${id}`);
			return true;
		} else {
			addError("Couldn't create a new organization with this invite code", id ?? undefined);
			return false;
		}
	}

	let name = $state('');
	let orgName = $state('');
	let invite = $state('');
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
		inactive="Make sure your name and organization name are filled in."
		submit="Create"
		action={create}
		valid={() => name.length > 0 && orgName.length > 0}
	>
		<Field active={!submitting} label="your name" bind:text={name} />
		<Field active={!submitting} label="organization name" bind:text={orgName} />
		<Field active={!submitting} label="invite code" bind:text={invite} />
	</FormDialog>
{/if}
