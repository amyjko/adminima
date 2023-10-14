<script lang="ts">
	import type Activity from '../types/Activity';

	export let activity: Activity;
</script>

<div class="activity">{activity.what}</div>

<style>
	.activity {
		position: absolute;
		background: var(--salient);
		padding: var(--spacing);
		border-radius: var(--radius);
		color: var(--background);
		font-size: var(--small-size);
	}
</style>
