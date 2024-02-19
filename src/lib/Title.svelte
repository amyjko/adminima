<script lang="ts">
	import OrganizationLink from './OrganizationLink.svelte';
	import { getOrganizationContext } from './contexts';
	import { page } from '$app/stores';
	import Button from './Button.svelte';
	import Field from './Field.svelte';

	// The title to show in the header
	export let title: string;
	// A descriptive label for what kind of page this is
	export let kind: string = '';
	// An optional function for editing the title
	export let edit: undefined | ((text: string) => void) = undefined;

	const organization = getOrganizationContext();

	let editing = false;
	let revision = '';
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="title">
	<div class="kind">{kind}</div>
	<h1>
		{#if editing}<input type="text" bind:value={revision} />{:else}{title}{/if}
	</h1>
	{#if edit}
		<div>
			<Button
				action={() => {
					if (editing) {
						if (edit) edit(revision);
						editing = false;
					} else {
						editing = true;
						revision = title;
					}
				}}
				>{#if editing}&checkmark;{:else}✎{/if}</Button
			>
		</div>{/if}
	{#if $organization && $page.url.pathname !== `/organization/${$organization.id}`}
		<div class="breadcrumbs"><OrganizationLink organizationID={$organization.id} /></div>
	{/if}
</div>

<style>
	h1 {
		display: inline-block;
		font-size: 42pt;
		font-weight: bold;
		text-transform: uppercase;
		line-height: 1;
		vertical-align: top;
	}
	.kind {
		color: var(--inactive);
		text-transform: uppercase;
	}

	.breadcrumbs {
		font-size: 12pt;
	}

	input {
		font-family: inherit;
		font-size: inherit;
		font-weight: inherit;
		text-transform: inherit;
		line-height: inherit;
		padding: 0;
		border: 0;
		outline: var(--thickness) solid var(--border);
	}

	input:focus {
		outline: var(--thickness) solid var(--focus);
	}
</style>
