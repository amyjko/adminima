<script lang="ts">
	import type Activity from '../types/Activity';

	export let activity: Activity;
	export let left: number | undefined = undefined;
</script>

<div class="activity" style:left="{left}px">{activity.what}</div>

<style>
	.activity {
		position: relative;
		background: var(--salient);
		padding: var(--spacing);
		border-radius: var(--radius);
		color: var(--background);
		font-size: var(--small-size);
		width: fit-content;
	}
</style>
