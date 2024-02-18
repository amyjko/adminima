<script lang="ts">
	import Loading from '$lib/Loading.svelte';
	import database from '$database/Database';
	import Header from '$lib/Header.svelte';
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

	const organization = getOrganizationContext();
	$: isAdmin = $organization.admins.includes($user.id);

	let newPerson: string = '';
</script>

<Title title="people" kind={$locale?.term.organization} />

<Paragraph
	>This is the list of people in this organization. <strong>Admins</strong> have permission to add and
	remove people from the organization, promote or demote people from admin status, and create and delete
	roles. Select a person to see the roles they have.</Paragraph
>

{#await database.getOrganizationPeople($organization.id)}
	<Loading />
{:then people}
	<ul>
		{#each people as person}
			<li>
				<PersonLink personID={person} />
				{#if $organization.admins.includes(person)}
					<em>admin</em>
				{/if}
				{#if isAdmin}
					{#if $organization.admins.length > 1 && $organization.admins.includes(person)}
						<Button action={() => database.updateOrganization(withoutAdmin($organization, person))}
							>make non-admin</Button
						>
					{:else if !$organization.admins.includes(person)}<Button
							action={() => database.updateOrganization(withAdmin($organization, person))}
							>make admin</Button
						>{/if}
				{/if}
				{#if !$organization.admins.includes(person)}
					<Button action={() => database.updateOrganization(withoutStaff($organization, person))}
						>remove</Button
					>
				{/if}
			</li>
		{/each}
	</ul>
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
