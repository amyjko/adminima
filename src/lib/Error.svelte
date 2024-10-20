<script lang="ts">
	import Button, { Delete } from './Button.svelte';
	import Oops from './Oops.svelte';
	import { getErrors, type DBError } from '$routes/+layout.svelte';

	interface Props {
		error: DBError;
	}

	let { error }: Props = $props();

	const errors = getErrors();
</script>

<div class="columns">
	<Button tip="Dismiss this alert" action={() => errors.set($errors.filter((e) => e !== error))}
		>{Delete}</Button
	>
	<div class="messages">
		<span>{error.message}</span>
		{#if error.error}<span class="sub">{error.error.message}</span>{/if}
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
		border: 1px solid var(--border);
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
