<script lang="ts">
	interface Props {
		date: Date;
		time?: boolean;
		warning?: boolean;
	}

	let { date, time = true, warning = false }: Props = $props();
</script>

<span class="time" class:warning>{time ? date.toLocaleString() : date.toLocaleDateString()}</span>

<style>
	.time {
		font-size: var(--small-size);
	}

	.warning {
		text-decoration: underline var(--error) var(--thickness);
	}
</style>
