<script lang="ts">
	import { type Visibility as Vis } from '../database/Organizations';
	import { getOrg } from './contexts';

	export let level: Vis;
</script>

<div class:level class={level}>{level}</div>

<style>
	div {
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
