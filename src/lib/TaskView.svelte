<script lang="ts">
	import type { HowRow } from '$database/Organizations';
	import MarkupView from './MarkupView.svelte';
	import RoleLink from './RoleLink.svelte';

	export let how: HowRow;
</script>

<span
	><MarkupView inline markup={how.what} />
	{#if how.accountable}<RoleLink roleID={how.accountable} />{/if}</span
>
<ul>
	{#each how.how as subhow}
		<li><svelte:self how={subhow} /></li>
	{/each}
</ul>
