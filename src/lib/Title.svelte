<script lang="ts">
	import OrganizationLink from './OrganizationLink.svelte';
	import { getOrganizationContext } from './contexts';
	import { page } from '$app/stores';

	// The title to show in the header
	export let title: string;
	// A descriptive label for what kind of page this is
	export let kind: string = '';

	const organization = getOrganizationContext();
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="title">
	<div class="kind">{kind}</div>
	<h1>{title}</h1>
	{#if $organization && $page.url.pathname !== `/organization/${$organization.id}`}
		<div class="breadcrumbs"><OrganizationLink organizationID={$organization.id} /></div>
	{/if}
</div>

<style>
	h1 {
		font-size: 42pt;
		font-weight: bold;
		text-transform: uppercase;
		line-height: 1;
	}
	.kind {
		color: var(--inactive);
		text-transform: uppercase;
	}

	.breadcrumbs {
		font-size: 12pt;
	}
</style>
