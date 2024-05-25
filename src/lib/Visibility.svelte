<script lang="ts">
	import { type Visibility as Vis } from '../database/Organizations';
	import { getOrg } from './contexts';

	export let visibility: Vis;

	const org = getOrg();
</script>

<span class:visibility class={visibility}>{visibility}</span>

<style>
	.visibility {
		text-transform: none;
		display: inline-block;
		align-self: flex-start;
		font-size: var(--small-size);
		padding-left: var(--padding);
		padding-right: var(--padding);
		color: var(--background);
		background-color: var(--focus);
		vertical-align: middle;
	}
</style>
