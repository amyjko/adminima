<script lang="ts">
	import { locale } from '../types/Locales';
	import type Change from '../types/Change';
	import Text from './Text.svelte';

	export let modifications: Change[];
</script>

<div>
	{modifications.length}
	<Text text={$locale?.term.change} />s
</div>

<style>
	div {
		color: var(--inactive);
		font-size: medium;
	}
</style>
