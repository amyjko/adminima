<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/Button.svelte';
	import Notice from '$lib/Notice.svelte';
	import Oops from '$lib/Oops.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import { getDB, getUser } from '$routes/+layout.svelte';
	import { addError } from '$routes/errors.svelte';
	import OrganizationLink from '$lib/OrganizationLink.svelte';
	import PersonLink from '$lib/ProfileLink.svelte';
	import NewOrganization from '$lib/NewOrganization.svelte';
	import Tip from '$lib/Tip.svelte';
	import Link from '$lib/Link.svelte';
	import Table from '$lib/Table.svelte';
	import { page } from '$app/stores';
	import Header from '$lib/Header.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const user = getUser();
	const db = getDB();

	let orgs = $derived(data.orgs);
	let isSelf = $derived($user && $user.id === $page.params.personid);

	async function logout() {
		const { error } = await db.signOut();
		if (error) addError(error.code ?? error.message);
		else goto(`/login`);
	}
</script>

<Title title={isSelf ? 'You' : 'Person'}>
	{#if isSelf}<Button action={logout} tip="Log out of the application.">Log out</Button>{/if}
</Title>

<Header>Organizations</Header>

{#if orgs === null}
	<Oops text="Couldn't load this person's organizations" />
{:else}
	{#if isSelf}
		<Tip
			>Want to create an organization? Make sure you've got an invite code from <Link
				to="mailto:ajko@uw.edu">Amy</Link
			>.</Tip
		>
		<NewOrganization />
	{/if}
	{#if orgs.length > 0}
		<Paragraph
			>Here are the organizations {#if isSelf}you are{:else}this person is{/if} part of:</Paragraph
		>
		<Table full={false}>
			{#each orgs as org}
				<tr>
					<td> <OrganizationLink id={org.paths[0] ?? org.id} name={org.name} /></td>
					<td
						>{#if org.profiles.length > 0}{#await db.getPersonProfile(org.id, org.profiles[0].personid) then profile}
								<PersonLink {profile} />
							{/await}{/if}
					</td>
				</tr>
			{/each}
		</Table>
	{:else}
		<Notice
			>{#if isSelf}You are{:else}this person is{/if} not part of any organizations.
			{#if isSelf}<ul>
					<li>Join one by asking the person in charge.</li>
					<li>Create one if you're in charge.</li>
				</ul>{/if}</Notice
		>
	{/if}
{/if}
