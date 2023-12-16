<script lang="ts">
	import Link from './Link.svelte';
	import Title from './Title.svelte';

	export let title: string;
	export let kind: string | undefined;
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="page">
	<div class="header"><Link to="/">⎋</Link></div>
	<div class="content">
		{#if kind}
			<div class="kind">{kind}</div>
		{/if}
		<Title>{title}</Title>
		<slot />
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
		width: 100%;
		height: fit-content;
	}

	.content {
		max-width: 32em;
		margin-block-start: 10vh;
	}
</style>
