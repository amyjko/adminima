<script lang="ts">
	export let date: Date;
</script>

<span class="time">{date.toLocaleString()}</span>

<style>
	.time {
		color: var(--inactive);
		font-size: var(--small-size);
	}
</style>
