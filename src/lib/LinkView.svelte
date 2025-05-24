<script lang="ts">
	import type { default as MarkupLink } from '../markup/Link';
	import Link from '$lib/Link.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import RoleLink from './RoleLink.svelte';
	import ProcessLink from './ProcessLink.svelte';

	interface Props {
		segment: MarkupLink;
	}

	let { segment }: Props = $props();

	const context = getOrg();

	let lowerURL = $derived(segment.url.toLocaleLowerCase());

	// Does the link correspond to a role short name?
	let role = $derived(
		context.shortRoles.find(
			(role) =>
				role.short.some((name) => name.toLocaleLowerCase() === lowerURL) ||
				role.title.toLocaleLowerCase() === lowerURL
		)
	);
	// Does the link correspond to a process short name?
	let process = $derived(
		context.shortProcesses.find(
			(process) =>
				process.short.some((name) => name.toLocaleLowerCase() === lowerURL) ||
				process.title.toLocaleLowerCase() === lowerURL
		)
	);
</script>

{#if role}
	<RoleLink {role} />
{:else if process}
	<ProcessLink {process} />
{:else}
	<Link to={segment.url.startsWith('http') || segment.url.startsWith('/') ? segment.url : ''}
		>{segment.text.length === 0 ? '—' : segment.text}</Link
	>
{/if}
