<script lang="ts">
	import type Task from '../types/Task';
	import MarkupView from './MarkupView.svelte';
	import PersonLink from './PersonLink.svelte';

	export let task: Task;
</script>

<span style:text-decoration={task.complete ? 'line-through' : ''}>
	<MarkupView inline markup={task.what} /></span
>
(<PersonLink personID={task.who} short />)
<ul>
	{#each task.how as how}
		<li><svelte:self task={how} /></li>
	{/each}
</ul>
