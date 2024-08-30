<script lang="ts">
	import { getDB, getErrors, getOrg, getUser, queryOrError } from '$lib/contexts';
	import Paragraph from '$lib/Paragraph.svelte';
	import Field from '$lib/Field.svelte';
	import Button, { Delete } from '$lib/Button.svelte';
	import PersonLink from '$lib/ProfileLink.svelte';
	import Title from '$lib/Title.svelte';
	import Checkbox from '$lib/Checkbox.svelte';
	import RoleLink from '$lib/RoleLink.svelte';
	import { type PersonRow } from '$database/OrganizationsDB';
	import TeamLink from '$lib/TeamLink.svelte';
	import Select from '$lib/Select.svelte';
	import validEmail, { validNameAndEmail } from '../../../validEmail';
	import Form from '$lib/Form.svelte';
	import Notice from '$lib/Notice.svelte';
	import Link from '$lib/Link.svelte';
	import Tip from '$lib/Tip.svelte';
	import Header from '$lib/Header.svelte';
	import Table from '$lib/Table.svelte';

	const organization = getOrg();
	const user = getUser();
	const db = getDB();
	const errors = getErrors();

	$: isAdmin = $user && $organization.hasAdminPerson($user.id);

	let newPersonEmail: string = '';
	let match: PersonRow | undefined | null = undefined;
	$: existing = $organization.getProfileWithEmail(newPersonEmail);

	let newRole: string | undefined = undefined;

	async function addEmail() {
		let email = newPersonEmail;
		let name = undefined;
		if (validNameAndEmail(newPersonEmail)) {
			const parts = newPersonEmail.split('<');
			name = parts[0].trim();
			email = parts[1].replace('>', '').trim();
		}

		match = undefined;
		match = await $db.getPersonWithEmail(email);
		await (match === null
			? queryOrError(
					errors,
					$db.addPersonByEmail($organization.getID(), email, name),
					"Couldn't add person."
			  )
			: match !== null && match !== undefined
			? queryOrError(
					errors,
					$db.addPersonByID($organization.getID(), match.id),
					"Couldn't add person."
			  )
			: undefined);
		newPersonEmail = '';
	}

	$: active = !match && !existing && newPersonEmail.length > 0;
</script>

<Title title="People" kind="person" />

<Tip member
	>This is the list of people in this organization. <strong>Admins</strong> have permission to add and
	remove people from the organization, promote or demote people from admin status, and create and delete
	roles. Select a person to see the roles they have.</Tip
>

{#if isAdmin && $organization.getRoles().length === 0}
	<Notice
		>Want to give people roles? First you'll need to <Link to="/org/{$organization.getPath()}/roles"
			>define some</Link
		>.</Notice
	>
{/if}

{#if isAdmin}
	<Header>Add a person</Header>
	<Tip admin
		>Adding an email doesn't send an invitation, but they will have access once they log in.</Tip
	>
	<Form action={addEmail} {active} inactiveMessage="Make sure the email is valid.">
		<Field
			label="email or name <email>"
			bind:text={newPersonEmail}
			invalid={(text) =>
				text.length === 0 || validEmail(text) || validNameAndEmail(text)
					? undefined
					: 'Not a valid email'}
		/>
		<Button tip="Add this person to the organization" action={addEmail} {active} submit>Add</Button>
		{#if existing}
			<Paragraph>This person is already added.</Paragraph>
		{/if}
	</Form>
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
		{#each $organization.getProfiles() as profile}
			{@const roles = $organization
				.getProfileRoles(profile.id)
				.sort((a, b) => a.title.localeCompare(b.title))}
			<tr>
				<td>
					<PersonLink {profile} />
				</td>
				<td class="roles">
					{#if isAdmin}
						{@const remainingRoles = $organization
							.getRoles()
							.filter((r) => !roles.some((currentRole) => currentRole.id === r.id))
							.sort((a, b) => a.title.localeCompare(b.title))}
						{#if $organization.getRoles().length === 0}
							<em>&mdash;</em>
						{:else if remainingRoles.length > 0}
							<Select
								tip="Choose a role for this person."
								bind:selection={newRole}
								fit="1.5em"
								options={[
									{ value: undefined, label: '▾' },
									...remainingRoles.map((role) => {
										return { value: role.id, label: role.title };
									})
								]}
								change={async (roleID) => {
									newRole = undefined;
									if (roleID !== undefined)
										await queryOrError(
											errors,
											$db.assignPerson($organization.getID(), profile.id, roleID),
											'Could not assign role.'
										);
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
													errors,
													$db.unassignPerson($organization.getID(), profile.id, role.id),
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
						<Select
							tip="Choose a supervisor for this person."
							options={[
								{ value: undefined, label: '—' },
								...$organization
									.getProfiles()
									.filter((prof) => prof.id !== profile.id)
									.map((prof) => {
										return {
											value: prof.id,
											label: prof.name.length === 0 ? prof.email : prof.name
										};
									})
							]}
							selection={profile.supervisor ?? undefined}
							change={(profileID) => {
								queryOrError(
									errors,
									$db.updateProfileSupervisor($organization.getID(), profile.id, profileID ?? null),
									"Couldn't update supervisor."
								);
							}}
						/>
					{:else if profile.supervisor}<PersonLink
							profile={$organization.getProfileWithID(profile.supervisor)}
						/>{/if}
				</td>
				<td>
					{#if isAdmin}
						<Checkbox
							tip={isAdmin ? "Remove this person's admin status" : 'Make this person an admin.'}
							on={$organization.hasAdminProfile(profile.id)}
							enabled={isAdmin &&
								($organization.getAdminCount() > 1 || !$organization.hasAdminProfile(profile.id))}
							change={(on) =>
								queryOrError(
									errors,
									$db.updateAdmin($organization.getID(), profile.id, on),
									"Couldn't update admin status."
								)}
						/>
					{:else if $organization.hasAdminProfile(profile.id)}&check;{/if}
				</td>

				{#if isAdmin}
					<td>
						<Button
							tip="Remove this person from the organization."
							action={() =>
								queryOrError(errors, $db.removeProfile(profile.id), "Couldn't remove person.")}
							active={!$organization.hasAdminProfile(profile.id)}>{Delete}</Button
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
		flex-direction: column;
		gap: var(--padding);
	}

	.role {
		display: flex;
		flex-direction: row;
		gap: var(--padding);
	}

	.roles {
		display: flex;
		flex-direction: row;
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
