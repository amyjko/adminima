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
	import Select from '$lib/Select.svelte';

	const organization = getOrg();
	const user = getUser();

	$: isAdmin = $user && $organization.hasAdmin($user.id);

	let newPerson: string = '';
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
			<th style:width="20%">person</th>
			<th style:width="20%">roles</th>
			<th style:width="20%">teams</th>
			<th style:width="20%">supervisor</th>
			<th style:width="10%">admin</th>
			{#if isAdmin}
				<th style:width="10%">remove</th>
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
					{#if isAdmin}
						<Select
							selection={roles[0]?.id}
							options={[
								{ value: undefined, label: '—' },
								...$organization.getRoles().map((role) => {
									return { value: role.id, label: role.title };
								})
							]}
							change={(roleID) => {
								for (const role of roles)
									Organizations.unassignPerson($organization.getID(), profile.personid, role.id);
								if (roleID !== undefined)
									Organizations.assignPerson($organization.getID(), profile.personid, roleID);
							}}
						/>
					{:else}
						{#each roles.sort((a, b) => a.title.localeCompare(b.title)) as role}
							<span class="role"><RoleLink roleID={role.id} /></span>
						{/each}
					{/if}
				</td>
				<td class="team">
					{#each roles as role}{#if role.team}<TeamLink id={role.team} />{/if}{/each}
				</td>
				<td class="supervisor">
					{#if isAdmin}
						<Select
							options={[
								{ value: undefined, label: '—' },
								...$organization
									.getProfiles()
									.filter((prof) => prof.personid !== profile.personid)
									.map((prof) => {
										return { value: prof.personid, label: prof.name };
									})
							]}
							selection={profile.supervisor ?? undefined}
							change={(personID) => {
								Organizations.updatePersonSupervisor(
									$organization.getID(),
									profile.personid,
									personID ?? null
								);
							}}
						/>
					{:else if profile.supervisor}<PersonLink
							profile={$organization.getProfile(profile.supervisor)}
						/>{/if}
				</td>
				<td>
					{#if isAdmin}
						<Checkbox
							on={$organization.hasAdmin(profile.personid)}
							enabled={isAdmin &&
								($organization.getAdminCount() > 1 || !$organization.hasAdmin(profile.personid))}
							change={(on) =>
								Organizations.updateAdmin($organization.getID(), profile.personid, on)}
						/>
					{:else if $organization.hasAdmin(profile.personid)}&check;{/if}
				</td>

				{#if isAdmin}
					<td>
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
	.role,
	.team {
		font-size: var(--small-size);
	}
</style>
