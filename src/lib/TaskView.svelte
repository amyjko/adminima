<script lang="ts">
	import MarkupView from './MarkupView.svelte';
	import type { Task } from '../types/Process';
	import RoleLink from './RoleLink.svelte';

	export let task: Task;
</script>

<span
	><MarkupView inline markup={task.what} />
	<RoleLink roleID={task.accountable} /></span
>
<ul>
	{#each task.how as how}
		<li><svelte:self task={how} /></li>
	{/each}
</ul>
