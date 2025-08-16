<script lang="ts">
	import Logo from './Logo';

	interface Props {
		inline?: boolean;
		text?: string;
	}

	let { inline = true }: Props = $props();
</script>

<div class:inline><span class="dots">{Logo}</span></div>

<style>
	div {
		display: flex;
		height: 1em;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}

	.inline {
		display: inline;
		width: auto;
		white-space: nowrap;
	}

	.dots {
		display: inline-block;
		text-align: baseline;
		transform-origin: center;
		animation: spin 1s infinite ease-in-out;
	}

	@keyframes spin {
		0% {
			transform: translateX(-0.5em);
		}
		50% {
			transform: translateX(0.5em);
		}
		100% {
			transform: translateX(-0.5em);
		}
	}
</style>
