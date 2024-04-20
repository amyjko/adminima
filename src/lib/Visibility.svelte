<script lang="ts">
	import type Visibility from '$types/Visibility';
	import { getOrg } from './contexts';

	export let visibility: Visibility;

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
