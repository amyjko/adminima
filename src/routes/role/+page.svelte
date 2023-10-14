<script lang="ts">
	import Header from '../../lib/Header.svelte';
	import Paragraph from '../../lib/Paragraph.svelte';
	import Time from '../../lib/Time.svelte';

	let name = 'Associate Dean for Academics';
	let description =
		'Annual tasks the associate dean is responsible for completing, with the help of assistants.';
</script>

<div class="scope">
	<div class="meta">
		<Header>Role</Header>
		<Paragraph>{description}</Paragraph>
	</div>
	<Time />
</div>

<style>
	.scope {
		display: flex;
		flex-direction: column;
		width: 100vw;
		height: 100vh;
	}

	.meta {
		padding: var(--spacing);
	}
</style>
