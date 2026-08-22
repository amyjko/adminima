<script lang="ts">
	import { announcement } from './editor/announce.svelte';
</script>

<!--
	The one live region in the application. Polite, so it waits for a gap rather than interrupting,
	and atomic, so a message is read as a whole rather than as the words that changed.
-->
<div class="announcement" aria-live="polite" aria-atomic="true">{announcement()}</div>

<style>
	.announcement {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
