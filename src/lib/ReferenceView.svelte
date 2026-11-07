<script lang="ts">
	import type Reference from '../markup/Reference';
	import { getOrg } from '#routes/org/[orgid]/+layout.svelte';
	import RoleLink from './RoleLink.svelte';
	import ProcessLink from './ProcessLink.svelte';
	import Oops from './Oops.svelte';
	import { find } from './editor/references';

	interface Props {
		segment: Reference;
	}

	let { segment }: Props = $props();

	const context = getOrg();

	// The same rule the picker offers by, so that what it offers is what this resolves.
	let role = $derived(find(context().shortRoles, segment.target));
	let process = $derived(find(context().shortProcesses, segment.target));
</script>

{#if role}
	<RoleLink {role} />
{:else if process}
	<ProcessLink {process} />
{:else if !context().member}
	<!-- Non-members may not be able to see the org's roles, so just show the text the author wrote,
	 or the target if they didn't write any, as in <@AOM>. -->
	{segment.text.length > 0 ? segment.text : segment.target}
{:else}
	<!-- Say so, rather than rendering a link that silently goes nowhere. -->
	<Oops inline text="Unknown role or process: {segment.target}" />
{/if}
