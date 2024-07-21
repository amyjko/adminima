<script lang="ts">
	import ChangeForm from '$lib/ChangeForm.svelte';
	import Header from '$lib/Header.svelte';
	import Title from '$lib/Title.svelte';
	import { page } from '$app/stores';

	$: role = $page.url.searchParams.get('role') ?? undefined;
	$: process = $page.url.searchParams.get('process') ?? undefined;
</script>

<Title title="New change" kind="change" />

<Header>Suggest a Change</Header>

<ChangeForm {role} {process} />
