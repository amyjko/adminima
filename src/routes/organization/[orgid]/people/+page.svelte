<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import { getOrg, getUser } from '$lib/contexts';
	import Paragraph from '$lib/Paragraph.svelte';
	import Admin from '$lib/Admin.svelte';
	import Field from '$lib/Field.svelte';
	import Button from '$lib/Button.svelte';
	import PersonLink from '$lib/PersonLink.svelte';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';
	import Checkbox from '$lib/Checkbox.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import Organizations from '$database/Organizations';
	import TeamLink from '$lib/TeamLink.svelte';
	import type { PersonID } from '$types/Organization';

	const organization = getOrg();
	const user = getUser();

	$: isAdmin = $user && $organization.hasAdmin($user.id);

	let newPerson: string = '';

	function toggleAdmin(admin: boolean, person: PersonID) {
		Organizations.updateAdmin($organization.getID(), person, admin);
	}
</script>

<Title title="people" kind={$locale?.term.organization} />

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
		{#each $organization.getProfiles() as profile}
			{@const roles = $organization.getPersonRoles(profile.personid)}
			<tr>
				<td>
					<PersonLink {profile} />
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
							on={$organization.hasAdmin(profile.personid)}
							enabled={isAdmin &&
								($organization.getAdminCount() > 1 || !$organization.hasAdmin(profile.personid))}
							change={(on) => toggleAdmin(on, profile.personid)}
						/>
					</td>
					<td class="actions">
						<Button
							action={() => Organizations.removePerson($organization.getID(), profile.personid)}
							active={!$organization.hasAdmin(profile.personid)}>&times;</Button
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
						<PersonLink profile={person} />
						{#if !$organization.hasPerson(person.personid)}
							<Button action={() => Organizations.addPerson($organization.getID(), person.personid)}
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
