<script lang="ts">
	import type { HowRow } from '$database/Organizations';
	import Organizations from '$database/Organizations';
	import MarkupView from './MarkupView.svelte';
	import RoleLink from './RoleLink.svelte';
	import Visibility from './Visibility.svelte';

	export let how: HowRow;
</script>

<div class="how">
	<MarkupView
		text={how.what}
		unset="No comment"
		edit={(text) => Organizations.updateHowText(how, text)}
	/>
	<Visibility
		level={how.visibility}
		edit={(vis) =>
			vis === 'public' || vis === 'org' || vis === 'admin'
				? Organizations.updateHowVisibility(how, vis)
				: undefined}
	/>
	<span>
		{#if how.accountable}<RoleLink roleID={how.accountable} />{/if}</span
	>
	<ul>
		{#each how.how as subhow}
			<li><svelte:self how={subhow} /></li>
		{/each}
	</ul>
</div>

<style>
	.how {
		display: flex;
		flex-direction: column;
		gap: var(--padding);
	}
</style>
