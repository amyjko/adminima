<script lang="ts">
	import OrganizationLink from './OrganizationLink.svelte';
	import { getOrg } from './contexts';
	import { page } from '$app/stores';
	import Button from './Button.svelte';
	import Status from './Status.svelte';
	import type { StatusID } from '$types/Status';
	import type { default as Vis } from '$types/Visibility';
	import Visibility from './Visibility.svelte';
	import type { PostgrestError } from '@supabase/supabase-js';

	// The title to show in the header
	export let title: string;
	// A descriptive label for what kind of page this is
	export let kind: string = '';
	// The status of the thing
	export let status: StatusID | null = null;
	// The visibility of this content
	export let visibility: Vis | null;
	// An optional function for editing the title
	export let edit: undefined | ((text: string) => Promise<PostgrestError | null>) = undefined;

	const org = getOrg();

	let editing = false;
	let revision = '';
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="title">
	<div class="kind">
		{kind}
		{#if visibility}<Visibility {visibility} />{/if}
	</div>
	<h1>
		{#if editing}<input type="text" bind:value={revision} />{:else}<span class="text">{title}</span
			>{/if}{#if edit}<Button
				action={async () => {
					if (editing) {
						if (edit) {
							const error = await edit(revision);
							if (error) console.error(error);
							editing = false;
						}
					} else {
						editing = true;
						revision = title;
					}
				}}
				>{#if editing}&checkmark;{:else}✎{/if}</Button
			>{/if}
	</h1>
	{#if edit}
		<div />{/if}
	{#if $org && $page.url.pathname !== `/organization/${$org.getID()}`}
		<div class="breadcrumbs"><OrganizationLink org={$org} /><slot /></div>
	{/if}
	{#if status}<Status {status} />{/if}
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

	input {
		font-family: inherit;
		font-size: inherit;
		font-weight: inherit;
		text-transform: inherit;
		line-height: inherit;
		padding: 0;
		border: 0;
		border-radius: 0;
		height: 1em;
		outline: var(--thickness) solid var(--border);
	}

	input:focus {
		outline: var(--thickness) solid var(--focus);
	}

	.text {
		display: inline-block;
	}
</style>
