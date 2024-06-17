<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import Button from '$lib/Button.svelte';
	import Link from '$lib/Link.svelte';
	import NewOrganization from '$lib/NewOrganization.svelte';
	import Notice from '$lib/Notice.svelte';
	import Oops from '$lib/Oops.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import { getDB, getUser } from '$lib/contexts';
	import { page } from '$app/stores';

	let user = getUser();
	let db = getDB();
	let message: string | null = null;

	async function logout() {
		const { error } = await $db.signOut();
		if (error) message = error.code ?? error.message;
	}

	$: if (browser && $user === null) goto(`/login`);
</script>

<Title title="You" />

{#await $db.getPersonsOrganizations($page.params.personid) then orgs}
	{#if orgs === null}
		<Oops text="Couldn't load organizations" />
	{:else if $user}
		<Paragraph>Hi <strong>{$user.email}</strong>.</Paragraph>

		{#if orgs.length}
			<Paragraph>Here are the organizations you're part of:</Paragraph>
			<ul>
				{#each orgs as org}
					<li><Link to={`/organization/${org.id}`}>{org.name}</Link></li>
				{/each}
			</ul>
		{:else}
			<Notice
				>You're not part of any organizations.
				<ul>
					<li>Join one by asking the person in charge.</li>
					<li>Create one if you're in charge.</li>
				</ul></Notice
			>
		{/if}

		<NewOrganization />

		<Button action={logout}>Log out</Button>
	{/if}
{/await}

{#if message}
	<Oops text={message} />
{/if}
