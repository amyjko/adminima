<script lang="ts">
	export let label: string;
	export let text: string;
</script>

<label
	>{label}
	<input type="text" bind:value={text} /></label
>

<style>
	input {
		border-radius: var(--radius);
		border: 2px solid var(--border);
		font-size: var(--normal-size);
		font-family: var(--font);
	}

	label {
		font-style: italic;
	}

	input:focus {
		outline: var(--focus) solid var(--thickness);
	}
</style>
