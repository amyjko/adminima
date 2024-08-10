<script lang="ts">
	import type { default as MarkupLink } from '../markup/Link';
	import Link from '$lib/Link.svelte';
	import { getOrg } from './contexts';
	import RoleLink from './RoleLink.svelte';
	import ProcessLink from './ProcessLink.svelte';

	export let segment: MarkupLink;

	const org = getOrg();

	// Does the link correspond to a role short name?
	$: role = $org
		.getRoles()
		.find((role) => role.short.toLocaleLowerCase() === segment.url.toLocaleLowerCase());
	// Does the link correspond to a process short name?
	$: process = $org
		.getProcesses()
		.find((process) => process.short.toLocaleLowerCase() === segment.url.toLocaleLowerCase());

	$: console.log(role);
</script>

{#if role}
	<RoleLink roleID={role.id} />
{:else if process}
	<ProcessLink processID={process.id} />
{:else}
	<Link to={segment.url}>{segment.text}</Link>
{/if}
