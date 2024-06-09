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
	import Organizations, { type PersonRow } from '$database/Organizations';
	import TeamLink from '$lib/TeamLink.svelte';
	import Select from '$lib/Select.svelte';
	import Subheader from '$lib/Subheader.svelte';
	import validEmail from '../../../validEmail';
	import Form from '$lib/Form.svelte';
	import Notice from '$lib/Notice.svelte';
	import Link from '$lib/Link.svelte';

	const organization = getOrg();
	const user = getUser();

	$: isAdmin = $user && $organization.hasAdminPerson($user.id);

	let newPersonEmail: string = '';
	let match: PersonRow | undefined | null = undefined;
	$: existing = $organization.getProfileWithEmail(newPersonEmail);
</script>

<Title title="people" kind="person" />

<Paragraph
	>This is the list of people in this organization. <strong>Admins</strong> have permission to add and
	remove people from the organization, promote or demote people from admin status, and create and delete
	roles. Select a person to see the roles they have.</Paragraph
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
				<td>
					{#if isAdmin}
						{#if roles.length === 0}
							<em>&mdash;</em>
						{:else}
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
										Organizations.unassignPerson($organization.getID(), profile.id, role.id);
									if (roleID !== undefined)
										Organizations.assignPerson($organization.getID(), profile.id, roleID);
								}}
							/>
						{/if}
					{:else}
						{#each roles.sort((a, b) => a.title.localeCompare(b.title)) as role}
							<span class="role"><RoleLink roleID={role.id} /></span>
						{:else}<em>&mdash;</em>
						{/each}
					{/if}
				</td>
				<td class="team">
					{#each roles as role}{#if role.team}<TeamLink id={role.team} />{/if}{:else}<em>&mdash;</em
						>{/each}
				</td>
				<td class="supervisor">
					{#if isAdmin}
						<Select
							options={[
								{ value: undefined, label: '—' },
								...$organization
									.getProfiles()
									.filter((prof) => prof.id !== profile.id)
									.map((prof) => {
										return { value: prof.id, label: prof.name };
									})
							]}
							selection={profile.supervisor ?? undefined}
							change={(personID) => {
								Organizations.updateProfileSupervisor(
									$organization.getID(),
									profile.id,
									personID ?? null
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
							on={$organization.hasAdminProfile(profile.id)}
							enabled={isAdmin &&
								($organization.getAdminCount() > 1 || !$organization.hasAdminProfile(profile.id))}
							change={(on) => Organizations.updateAdmin($organization.getID(), profile.id, on)}
						/>
					{:else if $organization.hasAdminProfile(profile.id)}&check;{/if}
				</td>

				{#if isAdmin}
					<td>
						<Button
							action={() => Organizations.removeProfile(profile.id)}
							active={profile.personid !== null && !$organization.hasAdminProfile(profile.id)}
							>&times;</Button
						>
					</td>
				{/if}
			</tr>
		{/each}
	</tbody>
</table>

<Admin>
	<Subheader>Add people</Subheader>
	<Paragraph
		>Enter the email of the person to add. <em
			>This will not send an invitation; they can create an account at any time</em
		>.</Paragraph
	>
	<Form
		action={async () => {
			match = undefined;
			match = await Organizations.getPersonWithEmail(newPersonEmail);
			await (match === null
				? Organizations.addPersonByEmail($organization.getID(), newPersonEmail)
				: Organizations.addPersonByID($organization.getID(), match.id));
			newPersonEmail = '';
		}}
	>
		<Field
			label="email"
			bind:text={newPersonEmail}
			invalid={(text) => (text.length === 0 || validEmail(text) ? undefined : 'Not a valid email')}
		/>
		<Button action={() => {}} active={!match && !existing && newPersonEmail.length > 0} submit
			>Add</Button
		>
		{#if existing}
			<Paragraph>This person is already added.</Paragraph>
		{/if}
	</Form>
</Admin>

<style>
	.role,
	.team {
		font-size: var(--small-size);
	}
</style>
