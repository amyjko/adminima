<script lang="ts">
	import OrganizationLink from './OrganizationLink.svelte';
	import { getOrg } from './contexts';
	import { page } from '$app/stores';
	import Status from './Status.svelte';
	import type { PostgrestError } from '@supabase/supabase-js';
	import EditableText from './EditableText.svelte';

	// The title to show in the header
	export let title: string;
	// A descriptive label for what kind of page this is
	export let kind: string = '';
	// An optional function for editing the title
	export let edit: undefined | ((text: string) => Promise<PostgrestError | null>) = undefined;

	const org = getOrg();
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="title">
	<div class="kind">
		{kind}
	</div>
	<h1>
		<EditableText text={title} {edit} />
	</h1>
	{#if edit}
		<div />{/if}
	{#if $org && $page.url.pathname !== `/organization/${$org.getID()}`}
		<div class="breadcrumbs"><OrganizationLink org={$org} /><slot /></div>
	{/if}
	<slot />
</div>

<style>
	h1 {
		display: flex;
		font-size: 42pt;
		font-weight: bold;
		text-transform: uppercase;
		line-height: 1;
		flex-direction: row;
		justify-items: baseline;
		gap: var(--padding);
	}

	.kind {
		color: var(--inactive);
		text-transform: uppercase;
	}

	.breadcrumbs {
		font-size: 12pt;
		margin-bottom: var(--padding);
	}
</style>
