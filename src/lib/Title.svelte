<script lang="ts">
	import OrganizationLink from './OrganizationLink.svelte';
	import { getOrg } from './contexts';
	import { page } from '$app/stores';
	import type { PostgrestError } from '@supabase/supabase-js';
	import EditableText from './EditableText.svelte';
	import RoleLink from './RoleLink.svelte';
	import PersonLink from './ProfileLink.svelte';
	import ProcessLink from './ProcessLink.svelte';
	import SuggestionLink from './SuggestionLink.svelte';
	import Link from './Link.svelte';

	// The title to show in the header
	export let title: string;
	// A descriptive label for what kind of page this is
	export let kind:
		| 'process'
		| 'suggestion'
		| 'team'
		| 'person'
		| 'role'
		| 'organization'
		| 'error'
		| undefined = undefined;
	// An optional function for editing the title
	export let edit: undefined | ((text: string) => Promise<PostgrestError | null>) = undefined;

	const org = getOrg();
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="title {kind}">
	{#if $org && $page.url.pathname !== `/organization/${$org.getID()}`}
		<div class="breadcrumbs">
			<OrganizationLink id={$org.getID()} name={$org.getName()} />
			{#if $page.url.pathname.includes('/role/')} &gt;<RoleLink roleID={null} /> {/if}
			{#if $page.url.pathname.includes('/process/')} &gt;<ProcessLink processID={null} /> {/if}
			{#if $page.url.pathname.includes('/suggestion/')}
				&gt;<Link to="/organization/{$org.getID()}/suggestions" kind="suggestion">Suggestions</Link
				>{/if}
			{#if $page.url.pathname.includes('/person/')}
				&gt; <Link to="/organization/{$org.getID()}/people" kind="person">People</Link>{/if}
		</div>
	{/if}
	{#if kind}
		<div class="kind">
			{kind}
		</div>
	{/if}
	<h1>
		<EditableText text={title} {edit} />
	</h1>
	{#if edit}
		<div />{/if}
	<slot />
</div>

<style>
	.title {
		width: calc(100%);
		margin-left: calc(-2 * var(--spacing));
		padding: calc(2 * var(--spacing));
		/* position: sticky;
		top: 0; */
		z-index: 1;
		background: var(--background);
	}

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
		color: var(--chrome);
		text-transform: uppercase;
	}

	.organization {
		background: var(--foreground);
		color: var(--background);
	}

	.role {
		background-color: var(--warning);
		color: var(--background);
	}

	.process {
		background-color: var(--error);
		color: var(--background);
	}

	.person {
		color: var(--salient);
	}

	.person .kind {
		color: var(--inactive);
	}

	.org {
		background-color: var(--foreground);
		color: var(--background);
	}
	.suggestion {
		background-color: var(--salient);
		color: var(--background);
	}

	.team {
		background-color: var(--foreground);
		color: var(--background);
	}

	.breadcrumbs {
		font-size: 12pt;
		margin-bottom: var(--padding);
	}
</style>
