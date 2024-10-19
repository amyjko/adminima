<script lang="ts">
	import type { default as MarkupLink } from '../markup/Link';
	import Link from '$lib/Link.svelte';
	import { getOrg } from './contexts.svelte';
	import RoleLink from './RoleLink.svelte';
	import ProcessLink from './ProcessLink.svelte';

	interface Props {
		segment: MarkupLink;
	}

	let { segment }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);

	let lowerURL = $derived(segment.url.toLocaleLowerCase());

	// Does the link correspond to a role short name?
	let role = $derived(
		org
			.getRoles()
			.find(
				(role) =>
					role.short.some((name) => name.toLocaleLowerCase() === lowerURL) ||
					role.title.toLocaleLowerCase() === lowerURL
			)
	);
	// Does the link correspond to a process short name?
	let process = $derived(
		org
			.getProcesses()
			.find(
				(process) =>
					process.short.some((name) => name.toLocaleLowerCase() === lowerURL) ||
					process.title.toLocaleLowerCase() === lowerURL
			)
	);
</script>

{#if role}
	<RoleLink roleID={role.id} />
{:else if process}
	<ProcessLink processID={process.id} />
{:else}
	<Link to={segment.url.startsWith('http') || segment.url.startsWith('/') ? segment.url : ''}
		>{segment.text.length === 0 ? '—' : segment.text}</Link
	>
{/if}
