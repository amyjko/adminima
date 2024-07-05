<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import Button from '$lib/Button.svelte';
	import Notice from '$lib/Notice.svelte';
	import Oops from '$lib/Oops.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import { getDB, getUser } from '$lib/contexts';
	import { page } from '$app/stores';
	import OrganizationLink from '$lib/OrganizationLink.svelte';
	import PersonLink from '$lib/ProfileLink.svelte';
	import Loading from '$lib/Loading.svelte';
	import NewOrganization from '$lib/NewOrganization.svelte';
	import Tip from '$lib/Tip.svelte';
	import Link from '$lib/Link.svelte';

	let user = getUser();
	let db = getDB();
	let message: string | null = null;

	async function logout() {
		const { error } = await $db.signOut();
		if (error) message = error.code ?? error.message;
		else goto(`/login`);
	}

	$: if (browser && $user === null) goto(`/login`);
</script>

<Title title="You" />

{#await $db.getPersonsOrganizations($page.params.personid)}
	<Loading />
{:then orgs}
	{#if orgs.data === null}
		<Oops text="Couldn't load organizations" />
	{:else if $user}
		<Paragraph>Hi <strong>{$user.email}</strong>!</Paragraph>

		{#if orgs.data.length}
			<Paragraph>Here are the organizations you're part of and your profiles for each:</Paragraph>
			<table>
				<tr>
					<th>Organization</th>
					<th>Profile</th>
				</tr>
				{#each orgs.data as org}
					<tr>
						<td> <OrganizationLink id={org.paths[0] ?? org.id} name={org.name} /></td>
						<td
							>{#await $db.getPersonProfile(org.id, $user.id) then profile}
								<PersonLink {profile} />
							{/await}
						</td>
					</tr>
				{/each}
			</table>
		{:else}
			<Notice
				>You're not part of any organizations.
				<ul>
					<li>Join one by asking the person in charge.</li>
					<li>Create one if you're in charge.</li>
				</ul></Notice
			>
		{/if}

		<Tip
			>Want to create an organization? Make sure you've got an invite code from <Link
				to="mailto:ajko@uw.edu">Amy</Link
			>.</Tip
		>

		<NewOrganization />

		<Button action={logout} tip="Log out of the application.">Log out</Button>
	{/if}
{/await}

{#if message}
	<Oops text={message} />
{/if}
