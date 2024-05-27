<script lang="ts">
	import { format } from 'date-fns';

	export let time: number;
</script>

<span class="time">{format(new Date(time), 'MM/dd/yyyy MM:ss')}</span>

<style>
	.time {
		color: var(--inactive);
		font-size: var(--small-size);
	}
</style>
