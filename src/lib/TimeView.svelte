<script lang="ts">
	interface Props {
		date: Date;
		time?: boolean;
	}

	let { date, time = true }: Props = $props();
</script>

<span class="time">{time ? date.toLocaleString() : date.toLocaleDateString()}</span>

<style>
	.time {
		font-size: var(--small-size);
	}
</style>
