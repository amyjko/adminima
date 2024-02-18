<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import database from '../../../../database/Database';
	import { goto } from '$app/navigation';
	import Oops from '$lib/Oops.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import Form from '$lib/Form.svelte';
	import Field from '$lib/Field.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Button from '$lib/Button.svelte';
	import Admin from '$lib/Admin.svelte';
	import { user } from '$database/Auth';
	import { getOrganizationContext } from '$lib/contexts';
	import Title from '$lib/Title.svelte';
	import OrganizationLink from '$lib/OrganizationLink.svelte';
	import { locale } from '$types/Locales';

	const organization = getOrganizationContext();

	let newRole: string = '';
	let newRoleError: string | undefined = undefined;

	async function createRole() {
		try {
			const role = await database.createRole($user.id, $organization.id, newRole);
			goto(`/role/${role.id}`);
		} catch (_) {
			newRoleError = "We couldn't create the new role.";
		}
	}
</script>

<Title title="roles" kind={$locale?.term.organization}
	><OrganizationLink organizationID={$organization.id} /></Title
>
<Paragraph
	>Roles can be held by one or more people and are associated with activities and change requests.</Paragraph
>

<Paragraph>These are the roles defined for this organization.</Paragraph>

{#await database.getOrganizationRoles($organization.id)}
	<Loading />
{:then roles}
	<ul>
		{#each roles.sort((a, b) => a.title.localeCompare(b.title)) as role}
			<li><RoleLink roleID={role.id} /></li>
		{/each}
	</ul>
{/await}

<Admin>
	<Form action={createRole}>
		<Paragraph>Want to add a new role to this organization?</Paragraph>
		<Field label="title of new role" bind:text={newRole} />
		<Button submit active={newRole.length > 3} action={() => {}}>create</Button>
		{#if newRoleError}
			<Oops text={newRoleError} />
		{/if}
	</Form>
</Admin>
