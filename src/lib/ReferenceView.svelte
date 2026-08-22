<script lang="ts">
	import type Reference from '../markup/Reference';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import RoleLink from './RoleLink.svelte';
	import ProcessLink from './ProcessLink.svelte';
	import Oops from './Oops.svelte';

	interface Props {
		segment: Reference;
	}

	let { segment }: Props = $props();

	const context = getOrg();

	let target = $derived(segment.target.toLocaleLowerCase());

	// Does the reference correspond to a role short name?
	let role = $derived(
		context().shortRoles.find(
			(role) =>
				role.short.some((name) => name.toLocaleLowerCase() === target) ||
				role.title.toLocaleLowerCase() === target
		)
	);
	// Does the reference correspond to a process short name?
	let process = $derived(
		context().shortProcesses.find(
			(process) =>
				process.short.some((name) => name.toLocaleLowerCase() === target) ||
				process.title.toLocaleLowerCase() === target
		)
	);
</script>

{#if role}
	<RoleLink {role} />
{:else if process}
	<ProcessLink {process} />
{:else}
	<!-- Say so, rather than rendering a link that silently goes nowhere. -->
	<Oops inline text="Unknown role or process: {segment.target}" />
{/if}
