<script lang="ts">
	import { onMount } from 'svelte';
	import { locale } from '../types/Locales';
	import Text from './Text.svelte';
	import Logo from './Logo';

	export let inline = true;

	let count = 1;

	onMount(() => {
		const timer = setInterval(() => {
			count = (count + 1) % 5;
		}, 100);
		return () => {
			clearInterval(timer);
		};
	});
</script>

<div class:inline>
	<span class="dots"><Text text={$locale?.term.loading} /> {Logo.repeat(count)}</span>
</div>

<style>
	div {
		display: flex;
		width: 100%;
		height: 1em;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}

	.inline {
		display: inline;
		width: auto;
	}
</style>
