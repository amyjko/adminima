<script lang="ts">
	import { onMount } from 'svelte';
	import Logo from './Logo';

	export let inline = true;
	export let text: string = 'Loading...';

	let count = 1;
	const Increments = 5;

	onMount(() => {
		const timer = setInterval(() => {
			count = (count + 1) % Increments;
		}, 50);
		return () => {
			clearInterval(timer);
		};
	});
</script>

<div class:inline>
	{text} <span class="dots" style:transform="rotate({360 * (count / Increments)}deg)">{Logo}</span>
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

	.dots {
		display: inline-block;
		text-align: center;
		transform-origin: center;
	}
</style>
