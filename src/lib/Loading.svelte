<script lang="ts">
	import { onMount } from 'svelte';
	import Logo from './Logo';

	interface Props {
		inline?: boolean;
		text?: string;
	}

	let { inline = true, text = 'Loading...' }: Props = $props();
</script>

<div class:inline>
	{text} <span class="dots">{Logo}</span>
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
		animation: spin 1s infinite linear;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
