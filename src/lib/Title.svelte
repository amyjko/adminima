<script lang="ts">
	import type { PostgrestError } from '@supabase/supabase-js';
	import EditableText from './EditableText.svelte';
	import OrgNav from './OrgNav.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';

	// The title to show in the header
	// The kind of page this is, to determine background
	// Whether to show the kind
	// An optional function for editing the title
	interface Props {
		title: string;
		kind?:
			| 'process'
			| 'change'
			| 'team'
			| 'person'
			| 'profile'
			| 'role'
			| 'organization'
			| 'error'
			| undefined;
		label?: boolean;
		edit?: undefined | ((text: string) => Promise<PostgrestError | null>);
		children?: import('svelte').Snippet;
	}

	let { title, kind = undefined, label = true, edit = undefined, children }: Props = $props();

	const org = getOrg();
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="title">
	<div class="background {kind}">
		{#if org}
			<OrgNav />
		{/if}
		<div>
			{#if kind && label}
				<div class="kind">
					{kind}
				</div>
			{/if}
			<h1>
				<EditableText text={title} {edit} />
			</h1>
		</div>
		<div class="metadata">{@render children?.()}</div>
	</div>
</div>

<style>
	.title {
		width: calc(100%);
		/* position: sticky;
		top: 0; */
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing) / 2);
	}

	.background {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing) / 2);
		background: var(--foreground);
		color: var(--background);
		padding: calc(var(--spacing));
	}

	h1 {
		display: flex;
		font-size: 42pt;
		font-weight: bold;
		line-height: 1;
		flex-direction: row;
		justify-items: baseline;
		gap: var(--padding);
		word-break: break-word;
	}

	.metadata {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: var(--spacing);
		align-items: center;
	}

	.kind {
		color: var(--chrome);
		text-transform: uppercase;
	}

	.organization {
		background: var(--foreground);
		color: var(--background);
	}

	.role {
		background-color: var(--warning);
		color: var(--background);
	}

	.process {
		background-color: var(--error);
		color: var(--background);
	}

	.person,
	.profile {
		background: var(--person);
		color: var(--background);
	}

	.person .kind {
		color: var(--background);
	}

	.org {
		background-color: var(--foreground);
		color: var(--background);
	}
	.change {
		background-color: var(--salient);
		color: var(--background);
	}

	.team {
		background-color: var(--foreground);
		color: var(--background);
	}

	.breadcrumbs {
		font-size: 12pt;
		margin-bottom: var(--padding);
	}
</style>
