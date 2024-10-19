<script lang="ts">
	interface Props {
		date: Date;
	}

	let { date }: Props = $props();
</script>

<span class="time">{date.toLocaleString()}</span>

<style>
	.time {
		color: var(--inactive);
		font-size: var(--small-size);
	}
</style>
