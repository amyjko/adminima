<script lang="ts">
	import ChangeForm from '$lib/ChangeForm.svelte';
	import ChangeList from '$lib/ChangeList.svelte';
	import { getOrg } from '$lib/contexts';
	import Header from '$lib/Header.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import { locale } from '$types/Locales';
	import { page } from '$app/stores';

	const organization = getOrg();

	$: role = $page.url.searchParams.get('role') ?? undefined;
	$: process = $page.url.searchParams.get('process') ?? undefined;

	$: console.log($page.url.searchParams.get('process'));
</script>

<Title title="Changes" kind={$locale?.term.organization} />

<Header>Suggest a Change</Header>

<ChangeForm {role} {process} />

<Header>Changes</Header>

<ChangeList changes={$organization.getChanges()}
	><Paragraph>There are no changes suggested for this organization.</Paragraph></ChangeList
>
