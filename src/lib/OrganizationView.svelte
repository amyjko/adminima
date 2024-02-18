<script lang="ts">
	import type Organization from '../types/Organization';
	import PersonLink from './PersonLink.svelte';
	import Header from '$lib/Header.svelte';
	import database from '../database/Database';
	import Button from './Button.svelte';
	import { withoutAdmin } from '../types/Organization';
	import { user } from '../database/Auth';
	import MarkupView from './MarkupView.svelte';
	import Link from './Link.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';

	export let organization: Organization;

	$: isAdmin = organization.admins.includes($user.id);
</script>

<Title title={organization.name} kind={$locale?.term.organization} />

<MarkupView markup={organization.description} />

<Link to="{organization.id}/roles">Roles</Link>
<Link to="{organization.id}/requests">Requests</Link>
<Link to="{organization.id}/activities">Activities</Link>
<Link to="{organization.id}/people">People</Link>

<Header>Admins</Header>
<p>Here are the people who can change this organization's roles.</p>
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
