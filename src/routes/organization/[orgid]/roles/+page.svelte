<script lang="ts">
	import Database from '$database/Database';
	import { goto } from '$app/navigation';
	import Oops from '$lib/Oops.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import Form from '$lib/Form.svelte';
	import Field from '$lib/Field.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Button from '$lib/Button.svelte';
	import Admin from '$lib/Admin.svelte';
	import { user } from '$database/Auth';
	import { getOrg } from '$lib/contexts';
	import Title from '$lib/Title.svelte';
	import OrganizationLink from '$lib/OrganizationLink.svelte';
	import { locale } from '$types/Locales';
	import Flow from '$lib/Flow.svelte';

	const org = getOrg();

	let newRole: string = '';
	let newRoleError: string | undefined = undefined;

	async function createRole() {
		try {
			const role = await Database.createRole($user.id, $org.getID(), newRole);
			goto(`/organization/${$org.getID()}/role/${role.id}`);
		} catch (_) {
			newRoleError = "We couldn't create the new role.";
		}
	}
</script>

<Title title="roles" kind={$locale?.term.organization} visibility="org"
	><OrganizationLink org={$org} /></Title
>
<Paragraph
	>These are the positions held in this organization. Each one is responsible for particular
	processes in this organization.</Paragraph
>

<Flow>
	{#each $org.getRoles().sort((a, b) => a.title.localeCompare(b.title)) as role}
		<RoleLink roleID={role.id} />
	{/each}
</Flow>

<Admin>
	<Form action={createRole}>
		<Paragraph>Want to add a new role to this organization?</Paragraph>
		<Field label="title of new role" bind:text={newRole} />
		<Button end submit active={newRole.length > 3} action={() => {}}>create</Button>
		{#if newRoleError}
			<Oops text={newRoleError} />
		{/if}
	</Form>
</Admin>
