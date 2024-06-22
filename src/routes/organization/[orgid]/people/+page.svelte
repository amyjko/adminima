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
	import validEmail from '../../../validEmail';
	import Form from '$lib/Form.svelte';
	import Notice from '$lib/Notice.svelte';
	import Link from '$lib/Link.svelte';
	import Tip from '$lib/Tip.svelte';
	import Header from '$lib/Header.svelte';

	const organization = getOrg();
	const user = getUser();
	const db = getDB();
	const errors = getErrors();

	$: isAdmin = $user && $organization.hasAdminPerson($user.id);

	let newPersonEmail: string = '';
	let match: PersonRow | undefined | null = undefined;
	$: existing = $organization.getProfileWithEmail(newPersonEmail);

	async function addEmail() {
		match = undefined;
		match = await $db.getPersonWithEmail(newPersonEmail);
		await (match === null
			? queryOrError(
					errors,
					$db.addPersonByEmail($organization.getID(), newPersonEmail),
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
</script>

<Title title="people" kind="person" />

<Tip
	>This is the list of people in this organization. <strong>Admins</strong> have permission to add and
	remove people from the organization, promote or demote people from admin status, and create and delete
	roles. Select a person to see the roles they have.</Tip
>

{#if isAdmin && $organization.getRoles().length === 0}
	<Notice
		>Want to give people roles? First you'll need to <Link
			to="/organization/{$organization.getID()}/roles">define some</Link
		>.</Notice
	>
{/if}

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
			{@const roles = $organization.getProfileRoles(profile.id)}
			<tr>
				<td>
					<PersonLink {profile} />
				</td>
				<td class="roles">
					{#each roles.sort((a, b) => a.title.localeCompare(b.title)) as role}
						<span class="role"
							><RoleLink roleID={role.id} />{#if isAdmin}<Button
									tip="Unassign this role from this person"
									action={async () => {
										const error = await queryOrError(
											errors,
											$db.unassignPerson($organization.getID(), profile.id, role.id),
											'Could not unassign role.'
										);
										if (error) return;
									}}>{Delete}</Button
								>{/if}</span
						>
					{/each}
					{#if isAdmin}
						{#if $organization.getRoles().length === 0}
							<em>&mdash;</em>
						{:else}
							<Select
								tip="Choose a role for this person."
								selection={undefined}
								fit={false}
								options={[
									{ value: undefined, label: '—' },
									...$organization
										.getRoles()
										.filter((r) => !roles.some((currentRole) => currentRole.id === r.id))
										.map((role) => {
											return { value: role.id, label: role.title };
										})
								]}
								change={async (roleID) => {
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
				</td>
				<td class="team">
					{#each roles as role}{#if role.team}<TeamLink id={role.team} />{/if}{:else}<em>&mdash;</em
						>{/each}
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
							change={(personID) => {
								queryOrError(
									errors,
									$db.updateProfileSupervisor($organization.getID(), profile.id, personID ?? null),
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
</table>

{#if isAdmin}
	<Header>Add people</Header>
	<Paragraph>Enter the email of the person to add. <em /></Paragraph>
	<Form action={addEmail}>
		<Field
			label="email"
			bind:text={newPersonEmail}
			invalid={(text) => (text.length === 0 || validEmail(text) ? undefined : 'Not a valid email')}
		/>
		<Button
			tip="Add this person to the organization"
			action={() => {}}
			active={!match && !existing && newPersonEmail.length > 0}
			submit>Add</Button
		>
		{#if existing}
			<Paragraph>This person is already added.</Paragraph>
		{/if}
	</Form>
	<Tip>This will not send an invitation; they can create an account at any time.</Tip>
{/if}

<style>
	.role,
	.team {
		font-size: var(--small-size);
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
	}
</style>
