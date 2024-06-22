<script lang="ts">
	import Button from './Button.svelte';
	import Oops from './Oops.svelte';
	import { getErrors, type DBError } from './contexts';

	export let error: DBError;

	const errors = getErrors();
</script>

<div class="columns">
	<Button tip="Dismiss this alert" action={() => errors.set($errors.filter((e) => e !== error))}
		>×</Button
	>
	<div class="messages">
		<span>{error.message}</span>
		<span class="sub">{error.error.message}</span>
	</div>
</div>

<style>
	.columns {
		display: flex;
		flex-direction: row;
		background: var(--error);
		color: var(--background);
		gap: var(--spacing);
		padding: calc(2 * var(--padding));
		border-radius: var(--radius);
		max-width: 30em;
		text-align: start;
		align-items: start;
	}

	.messages {
		display: flex;
		flex-direction: column;
		gap: var(--padding);
	}

	.sub {
		font-size: var(--small-size);
		font-style: italic;
	}
</style>
