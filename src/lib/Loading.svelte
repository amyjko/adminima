<script lang="ts">
	import { onMount } from 'svelte';
	import { locale } from '../types/Locales';
	import Text from './Text.svelte';

	let count = 1;

	onMount(() => {
		const timer = setInterval(() => {
			count++;
		}, 1000);
		return () => {
			clearInterval(timer);
		};
	});
</script>

<div><span class="dots"><Text text={$locale?.term.loading} /> {'⎋'.repeat(count)}</span></div>

<style>
	div {
		display: flex;
		width: 100%;
		height: 1em;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}
</style>
