<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import database from '$database/Database';
	import { getOrganizationContext } from '$lib/contexts';
	import Paragraph from '$lib/Paragraph.svelte';
	import Admin from '$lib/Admin.svelte';
	import Field from '$lib/Field.svelte';
	import Button from '$lib/Button.svelte';
	import PersonLink from '$lib/PersonLink.svelte';
	import { withAdmin, withStaff, withoutAdmin, withoutStaff } from '$types/Organization';
	import { user } from '$database/Auth';
	import Form from '$lib/Form.svelte';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';
	import type { PersonID } from '$types/Person';
	import Checkbox from '$lib/Checkbox.svelte';
	import RoleLink from '$lib/RoleLink.svelte';

	const organization = getOrganizationContext();
	$: isAdmin = $organization.admins.includes($user.id);

	let newPerson: string = '';

	function toggleAdmin(admin: boolean, person: PersonID) {
		database.updateOrganization(
			admin ? withAdmin($organization, person) : withoutAdmin($organization, person)
		);
	}
</script>

<Title title="people" kind={$locale?.term.organization} />

<Paragraph
	>This is the list of people in this organization. <strong>Admins</strong> have permission to add and
	remove people from the organization, promote or demote people from admin status, and create and delete
	roles. Select a person to see the roles they have.</Paragraph
>

{#await database.getOrganizationStaff($organization.id)}
	<Loading />
{:then people}
	<table>
		<tbody>
			<tr>
				<th>person</th>
				<th>roles</th>
				<th>admin</th>
				<th>remove</th>
			</tr>
			{#each people as person}
				<tr>
					<td>
						<PersonLink personID={person} />
					</td>
					<td>
						{#await database.getPersonRoles(person)}
							<Loading />
						{:then roles}
							{#each roles.sort((a, b) => a.title.localeCompare(b.title)) as role}
								<span class="role"><RoleLink roleID={role.id} /></span>
							{/each}
						{/await}
					</td>
					<td>
						<Checkbox
							on={$organization.admins.includes(person)}
							enabled={isAdmin &&
								($organization.admins.length > 1 || !$organization.admins.includes(person))}
							change={(on) => toggleAdmin(on, person)}
						/>
					</td>
					<td class="actions">
						<Button
							action={() => database.updateOrganization(withoutStaff($organization, person))}
							active={!$organization.admins.includes(person)}>&times;</Button
						>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/await}

<Admin>
	<Form>
		<Paragraph
			>Search for people by name to add them to this organization. They must already have an
			account.</Paragraph
		>
		<Field label="name" bind:text={newPerson} />
		{#if newPerson.length > 0}
			{#await database.getPeople(newPerson)}
				<Loading />
			{:then people}
				<ul>
					{#each people as person}
						<li>
							<PersonLink personID={person.id} email />
							{#if !$organization.staff.includes(person.id)}
								<Button
									action={() => database.updateOrganization(withStaff($organization, person.id))}
									>+</Button
								>{/if}
						</li>
					{/each}
				</ul>
			{/await}
		{/if}
	</Form>
</Admin>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		text-align: left;
		padding: var(--padding);
	}

	th {
		font-style: italic;
		border-bottom: var(--thickness) solid var(--border);
	}

	tr:last-child {
		border-bottom: var(--thickness) solid var(--border);
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--padding);
		align-items: left;
	}

	.role {
		font-size: var(--small-size);
	}
</style>
