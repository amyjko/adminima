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
	import Flow from './Flow.svelte';

	export let organization: Organization;

	$: isAdmin = organization.admins.includes($user.id);
</script>

<Title title={organization.name} kind={$locale?.term.organization} />

<MarkupView markup={organization.description} />

<Flow>
	<Link to="{organization.id}/roles">Roles</Link>
	<Link to="{organization.id}/people">People</Link>
	<Link to="{organization.id}/processes">Processes</Link>
	<Link to="{organization.id}/changes">Changes</Link>
</Flow>
