<script lang="ts">
	import Link from './Link.svelte';
	import Logo from './Logo';
	import Title from './Title.svelte';
	import type Change from '../types/Change';
	import Modifications from './Changes.svelte';

	export let title: string;
	export let kind: string | undefined;
	export let changes: Change[] | undefined;
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="page">
	<div class="header"><Link to="/">{Logo}</Link></div>
	<div class="content">
		{#if kind}
			<div class="kind">{kind}</div>
		{/if}
		<Title>{title}</Title>
		{#if changes}<Modifications modifications={changes} />{/if}
		<div class="body">
			<slot />
		</div>
	</div>
</div>

<style>
	.page {
		padding: var(--spacing);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.kind {
		color: var(--inactive);
		text-transform: uppercase;
	}

	.header {
		height: fit-content;
	}

	.content {
		max-width: 32em;
		margin-block-start: 10vh;
	}

	.body {
		margin-block-start: 2em;
	}
</style>
