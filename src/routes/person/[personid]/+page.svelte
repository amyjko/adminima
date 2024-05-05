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
	import { getUser } from '$lib/contexts';
	import { supabase } from '$lib/supabaseClient';

	export let data;

	let user = getUser();
	let message: string | null = null;

	async function logout() {
		const { error } = await supabase.auth.signOut();
		if (error) message = error.code ?? error.message;
	}

	$: if (browser && $user === null) goto(`/login`);

	let showCreateOrg = false;
</script>

<Title title="You" visibility={null} />

{#if data.orgs === null}
	<Oops text="Couldn't load organizations" />
{:else if $user}
	<Paragraph>Hi <strong>{$user.email}</strong>.</Paragraph>

	{#if data.orgs.length}
		<Paragraph>Here are the organizations you're part of:</Paragraph>
		<ul>
			{#each data.orgs as org}
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

	<Button action={() => (showCreateOrg = true)}>Create an organization</Button>
	{#if showCreateOrg}
		<NewOrganization close={() => (showCreateOrg = false)} />
	{/if}

	<Button action={logout}>Log out</Button>
{/if}

{#if message}
	<Oops text={message} />
{/if}
