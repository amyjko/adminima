<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import { getOrg } from '$lib/contexts';
	import Paragraph from '$lib/Paragraph.svelte';
	import Admin from '$lib/Admin.svelte';
	import Field from '$lib/Field.svelte';
	import Button from '$lib/Button.svelte';
	import PersonLink from '$lib/PersonLink.svelte';
	import { user } from '$database/Auth';
	import Form from '$lib/Form.svelte';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';
	import type { PersonID } from '$types/Person';
	import Checkbox from '$lib/Checkbox.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import Database from '$database/Database';
	import TeamLink from '$lib/TeamLink.svelte';

	const organization = getOrg();
	$: isAdmin = $organization.hasAdmin($user.id);

	let newPerson: string = '';

	function toggleAdmin(admin: boolean, person: PersonID) {
		Database.updateOrganization(
			admin ? $organization.withAdmin(person) : $organization.withoutAdmin(person)
		);
	}
</script>

<Title title="people" kind={$locale?.term.organization} visibility="org" />

<Paragraph
	>This is the list of people in this organization. <strong>Admins</strong> have permission to add and
	remove people from the organization, promote or demote people from admin status, and create and delete
	roles. Select a person to see the roles they have.</Paragraph
>

<table>
	<thead>
		<tr>
			<th>person</th>
			<th>roles</th>
			<th>teams</th>
			{#if isAdmin}
				<th>admin</th>
				<th>remove</th>
			{/if}
		</tr>
	</thead>
	<tbody>
		{#each $organization.getPeople() as person}
			{@const roles = $organization.getPersonRoles(person.id)}
			<tr>
				<td>
					<PersonLink {person} />
				</td>
				<td>
					{#each roles.sort((a, b) => a.title.localeCompare(b.title)) as role}
						<span class="role"><RoleLink roleID={role.id} /></span>
					{/each}
				</td>
				<td class="team">
					{#each roles as role}{#if role.team}<TeamLink id={role.team} />{/if}{/each}
				</td>
				{#if isAdmin}
					<td>
						<Checkbox
							on={$organization.hasAdmin(person.id)}
							enabled={isAdmin &&
								($organization.getAdminCount() > 1 || !$organization.hasAdmin(person.id))}
							change={(on) => toggleAdmin(on, person.id)}
						/>
					</td>
					<td class="actions">
						<Button
							action={() => Database.updateOrganization($organization.withoutStaff(person))}
							active={!$organization.hasAdmin(person)}>&times;</Button
						>
					</td>
				{/if}
			</tr>
		{/each}
	</tbody>
</table>

<Admin>
	<Paragraph
		>Search for people by name to add them to this organization. They must already have an account.</Paragraph
	>
	<Field label="name" bind:text={newPerson} />
	{#if newPerson.length > 0}
		{#await $organization.getPersonNamed(newPerson)}
			<Loading />
		{:then people}
			<ul>
				{#each people as person}
					<li>
						<PersonLink {person} email />
						{#if !$organization.hasStaff(person.id)}
							<Button action={() => Database.updateOrganization($organization.withStaff(person))}
								>+</Button
							>{/if}
					</li>
				{/each}
			</ul>
		{/await}
	{/if}
</Admin>

<style>
	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--padding);
		align-items: left;
	}

	.role,
	.team {
		font-size: var(--small-size);
	}
</style>
