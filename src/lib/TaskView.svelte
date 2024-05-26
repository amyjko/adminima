<script lang="ts">
	import type { HowRow } from '$database/Organizations';
	import MarkupView from './MarkupView.svelte';
	import RoleLink from './RoleLink.svelte';

	export let how: HowRow;
</script>

<MarkupView markup={how.what} unset="No comment" />
<span>
	{#if how.accountable}<RoleLink roleID={how.accountable} />{/if}</span
>
<ul>
	{#each how.how as subhow}
		<li><svelte:self how={subhow} /></li>
	{/each}
</ul>
