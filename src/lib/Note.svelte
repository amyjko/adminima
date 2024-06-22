<script lang="ts">
	export let inline: boolean = false;
</script>

<div class:inline><em><slot /></em></div>

<style>
	div {
		font-size: var(--small-size);
		font-style: italic;
	}

	.inline {
		display: inline;
	}
</style>
