<script lang="ts">
	import type Organization from '../types/Organization';
	import PersonLink from './PersonLink.svelte';
	import Header from './Header.svelte';
	import Loading from './Loading.svelte';
	import database from '../database/Database';
	import RoleLink from './RoleLink.svelte';
	import RequestList from './RequestList.svelte';
	import Button from './Button.svelte';
	import { withAdmin, withStaff, withoutAdmin, withoutStaff } from '../types/Organization';
	import { user } from '../database/Auth';
	import Form from './Form.svelte';
	import Field from './Field.svelte';
	import Paragraph from './Paragraph.svelte';
	import { goto } from '$app/navigation';
	import ParagraphView from './ParagraphView.svelte';
	import Oops from './Oops.svelte';

	export let organization: Organization;

	let newPerson: string = '';

	$: isAdmin = organization.admins.includes($user.id);

	let newRole: string = '';
	let newRoleError: string | undefined = undefined;

	async function createRole() {
		try {
			const role = await database.createRole($user.id, organization.id, newRole);
			goto(`/role/${role.id}`);
		} catch (_) {
			newRoleError = "We couldn't create the new role.";
		}
	}

	let newRequestTitle = '';
	let newRequestProblem = '';
	let newRequestError: string | undefined = undefined;

	async function createRequest() {
		try {
			const request = await database.createRequest(
				$user.id,
				organization.id,
				newRequestTitle,
				newRequestProblem,
				[],
				[]
			);
			goto(`/request/${request.id}`);
		} catch (_) {
			newRequestError = "We couldn't create the request.";
		}
	}
</script>

<Header>Admins</Header>
<p>Who has permissions to change this organization's roles.</p>
<ul>
	{#each organization.admins as admin (admin)}
		<li>
			<PersonLink personID={admin} />
			{#if isAdmin && organization.admins.length > 1}
				<Button action={() => database.updateOrganization(withoutAdmin(organization, admin))}
					>remove</Button
				>{/if}
		</li>
	{/each}
</ul>

<Header>Roles</Header>

{#if isAdmin}
	<Form action={createRole}>
		<Paragraph>Create a new role for this organization.</Paragraph>
		<Field label="title" bind:text={newRole} />
		<Button submit active={newRole.length > 3} action={() => {}}>create</Button>
		{#if newRoleError}
			<Oops text={newRoleError} />
		{/if}
	</Form>
{/if}

{#await database.getOrganizationRoles(organization.id)}
	<Loading />
{:then roles}
	<ul>
		{#each roles.sort((a, b) => a.title.localeCompare(b.title)) as role}
			<li><RoleLink roleID={role.id} /></li>
		{/each}
	</ul>
{/await}

<Header>Staff</Header>

{#if isAdmin}
	<Form>
		<Paragraph
			>Search for staff by name to add them to this organization. They must already have an account.</Paragraph
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
							{#if !organization.staff.includes(person.id)}
								<Button
									action={() => database.updateOrganization(withStaff(organization, person.id))}
									>+</Button
								>{/if}
						</li>
					{/each}
				</ul>
			{/await}
		{/if}
	</Form>
{/if}

{#await database.getOrganizationPeople(organization.id)}
	<Loading />
{:then people}
	<ul>
		{#each people as person}
			{#if !organization.admins.includes(person)}
				<li>
					<PersonLink personID={person} />
					{#if isAdmin && !organization.admins.includes(person)}
						<Button action={() => database.updateOrganization(withAdmin(organization, person))}
							>make admin</Button
						>
					{/if}
					{#if !organization.admins.includes(person)}
						<Button action={() => database.updateOrganization(withoutStaff(organization, person))}
							>remove</Button
						>
					{/if}
				</li>
			{/if}
		{/each}
	</ul>
{/await}

<Header>Requests</Header>

<Form action={createRequest}>
	<Paragraph>Is there something you'd like to change about this organization?</Paragraph>
	<Field label="title" bind:text={newRequestTitle} />
	<Field label="description" bind:text={newRequestProblem} />
	<Button
		submit
		active={newRequestTitle.length > 0 && newRequestProblem.length > 0}
		action={() => {}}>create</Button
	>

	{#if newRoleError}
		<Oops text={newRoleError} />
	{/if}
</Form>

{#await database.getOrganizationRequests(organization.id)}
	<Loading />
{:then requests}
	<RequestList {requests} />
{/await}
