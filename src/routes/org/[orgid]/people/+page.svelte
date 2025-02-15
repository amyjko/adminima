<script lang="ts">
	import { getOrg } from '$routes/+layout.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { queryOrError } from '$routes/errors.svelte';
	import Field from '$lib/Field.svelte';
	import Button, { Delete } from '$lib/Button.svelte';
	import PersonLink, { ProfileItem } from '$lib/ProfileLink.svelte';
	import Title from '$lib/Title.svelte';
	import Checkbox from '$lib/Checkbox.svelte';
	import RoleLink, { RoleItem } from '$lib/RoleLink.svelte';
	import { type PersonRow } from '$database/OrganizationsDB';
	import TeamLink from '$lib/TeamLink.svelte';
	import validEmail, { validNameAndEmail } from '../../../validEmail';
	import Notice from '$lib/Notice.svelte';
	import Link from '$lib/Link.svelte';
	import Tip from '$lib/Tip.svelte';
	import Table from '$lib/Table.svelte';
	import FormDialog from '$lib/FormDialog.svelte';
	import Options from '$lib/Options.svelte';

	const context = getOrg();
	let organization = $derived(context?.org);

	const user = getUser();
	const db = getDB();

	let isAdmin = $derived($user && organization.hasAdminPerson($user.id));

	let newPersonEmail: string = $state('');
	let match: PersonRow | undefined | null = undefined;
	let existing = $derived(organization.getProfileWithEmail(newPersonEmail));

	let filter = $state('');
	let lowerFilter = $derived(filter.toLocaleLowerCase().trim());

	let newRole: string | undefined = $state(undefined);

	async function addEmail() {
		let email = newPersonEmail;
		let name = undefined;
		if (validNameAndEmail(newPersonEmail)) {
			const parts = newPersonEmail.split('<');
			name = parts[0].trim();
			email = parts[1].replace('>', '').trim();
		}

		match = undefined;
		match = await db.getPersonWithEmail(email);
		await (match === null
			? queryOrError(db.addPersonByEmail(organization.getID(), email, name), "Couldn't add person.")
			: match !== null && match !== undefined
				? queryOrError(db.addPersonByID(organization.getID(), match.id), "Couldn't add person.")
				: undefined);
		newPersonEmail = '';

		return true;
	}
</script>

<Title title="People" kind="person" label={false} />

<Tip member
	>This is the list of people in this organization. <strong>Admins</strong> have permission to add and
	remove people from the organization, promote or demote people from admin status, and create and delete
	roles. Select a person to see the roles they have.</Tip
>

{#if isAdmin && organization.getRoles().length === 0}
	<Notice
		>Want to give people roles? First you'll need to <Link to="/org/{organization.getPath()}/roles"
			>define some</Link
		>.</Notice
	>
{/if}

{#if isAdmin}
	<FormDialog
		button="Add person …"
		showTip="Add a person."
		submitTip="Add this person."
		header="Add person"
		explanation="Add a person to this organization by their email address. They will not receive a notification."
		submit="Add"
		inactive={existing ? 'This person is already added' : 'Ensure the email address is valid'}
		action={addEmail}
		valid={() =>
			!existing &&
			newPersonEmail.length > 0 &&
			(validEmail(newPersonEmail) || validNameAndEmail(newPersonEmail))}
	>
		<Field
			label="email or name <email>"
			bind:text={newPersonEmail}
			invalid={(text) =>
				existing
					? 'This person is already added'
					: text.length === 0 || validEmail(text) || validNameAndEmail(text)
						? undefined
						: 'Not a valid email'}
		/>
	</FormDialog>
	<Field label="Filter by name or email" bind:text={filter} />
{/if}

<Table>
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
		{#each organization
			.getProfiles()
			.filter((prof) => lowerFilter === '' || prof.name
						.toLowerCase()
						.includes(lowerFilter) || prof.email.toLowerCase().includes(lowerFilter)) as profile}
			{@const roles = organization
				.getProfileRoles(profile.id)
				.sort((a, b) => a.title.localeCompare(b.title))}
			<tr>
				<td>
					<PersonLink {profile} />
				</td>
				<td class="roles">
					{#if isAdmin}
						{@const remainingRoles = organization
							.getRoles()
							.filter((r) => !roles.some((currentRole) => currentRole.id === r.id))
							.sort((a, b) => a.title.localeCompare(b.title))}
						{#if organization.getRoles().length === 0}
							<em>&mdash;</em>
						{:else if remainingRoles.length > 0}
							<Options
								id="profile-{profile.id}-role-chooser"
								tip="Choose a role for this person."
								bind:selection={newRole}
								searchable={{
									placeholder: 'role',
									include: (item, query) =>
										remainingRoles
											.find((r) => r.id === item)
											?.title.toLowerCase()
											.includes(query.toLowerCase()) === true
								}}
								view={RoleItem}
								empty={false}
								options={[
									...remainingRoles.map((role) => {
										return role.id;
									})
								]}
								change={async (roleID) => {
									newRole = undefined;
									if (roleID !== undefined)
										return (
											(await queryOrError(
												db.assignPerson(organization.getID(), profile.id, roleID),
												'Could not assign role.'
											)) === null
										);
									return true;
								}}
							/>
						{/if}
					{/if}
					<div class="role-list">
						{#each roles as role}
							<span class="role"
								><RoleLink roleID={role.id}
									>{#if isAdmin}<Button
											tip="Unassign this role from this person"
											chromeless
											action={async () => {
												const error = await queryOrError(
													db.unassignPerson(organization.getID(), profile.id, role.id),
													'Could not unassign role.'
												);
												if (error) return;
											}}>{Delete}</Button
										>{/if}</RoleLink
								></span
							>
						{/each}
					</div>
				</td>
				<td>
					<div class="teams">
						{#each roles.map((role) => role.team).filter((team) => team !== null) as team}<TeamLink
								id={team}
							/>{:else}<em>&mdash;</em>{/each}
					</div>
				</td>
				<td class="supervisor">
					{#if isAdmin}
						{@const eligibleSupervisors = organization
							.getProfiles()
							.filter((prof) => prof.id !== profile.id)}
						<Options
							id="profile-{profile.id}-supervisor-chooser"
							tip="Choose a supervisor for this person."
							searchable={{
								placeholder: 'name',
								include: (item, query) =>
									eligibleSupervisors
										.find((prof) => prof.id === item)
										?.name.toLowerCase()
										.includes(query.toLowerCase()) === true
							}}
							options={[undefined, ...eligibleSupervisors.map((prof) => prof.id)]}
							view={ProfileItem}
							selection={profile.supervisor ?? undefined}
							change={async (profileID) =>
								(await queryOrError(
									db.updateProfileSupervisor(organization.getID(), profile.id, profileID ?? null),
									"Couldn't update supervisor."
								)) === null}
						/>
					{:else if profile.supervisor}<PersonLink
							profile={organization.getProfileWithID(profile.supervisor)}
						/>{/if}
				</td>
				<td>
					{#if isAdmin}
						<Checkbox
							tip={isAdmin ? "Remove this person's admin status" : 'Make this person an admin.'}
							on={organization.hasAdminProfile(profile.id)}
							enabled={isAdmin &&
								(organization.getAdminCount() > 1 || !organization.hasAdminProfile(profile.id))}
							change={(on) =>
								queryOrError(
									db.updateAdmin(organization.getID(), profile.id, on),
									"Couldn't update admin status."
								)}
						/>
					{:else if organization.hasAdminProfile(profile.id)}&check;{/if}
				</td>

				{#if isAdmin}
					<td>
						<Button
							tip="Remove this person from the organization."
							action={() => queryOrError(db.removeProfile(profile.id), "Couldn't remove person.")}
							active={!organization.hasAdminProfile(profile.id)}>{Delete}</Button
						>
					</td>
				{/if}
			</tr>
		{/each}
	</tbody>
</Table>

<style>
	.role,
	.teams {
		font-size: var(--small-size);
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: var(--padding);
	}

	.role {
		display: flex;
		flex-direction: row;
		gap: var(--padding);
	}

	.roles {
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		gap: var(--padding);
		align-items: baseline;
	}

	.role-list {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		gap: var(--padding);
	}

	tr:nth-child(even) {
		background-color: var(--separator);
	}
</style>
