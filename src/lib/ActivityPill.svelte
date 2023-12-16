<script lang="ts">
	import type Activity from '../types/Activity';
	import Link from './Link.svelte';

	export let activity: Activity;
	export let left: number | undefined = undefined;
</script>

<div class="activity" style:left="{left}px" class:draft={activity.draft}>
	<Link bland to="/activity/{activity.id}">{activity.what}</Link>
</div>

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

	.draft {
		background: var(--warning);
	}
</style>
