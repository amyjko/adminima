<script lang="ts">
	import type { PostgrestError } from '@supabase/supabase-js';
	import { type Visibility as Vis, type Visibility } from '../database/OrganizationsDB';
	import Select from './Select.svelte';

	export let level: Vis;
	export let tip: string;
	export let edit: undefined | ((level: string) => Promise<PostgrestError | null> | undefined) =
		undefined;

	const opts: { value: Visibility; label: string }[] = [
		{ value: 'public', label: 'public' },
		{ value: 'org', label: 'org' },
		{ value: 'admin', label: 'admins' }
	] as const;
</script>

{#if edit}
	<Select
		{tip}
		selection={level}
		options={opts}
		change={(value) => (value ? edit(value) : undefined)}
	/>
{:else}
	<span class="visibility {level}">{level}</span>
{/if}

<style>
	.visibility {
		text-transform: none;
		display: inline-block;
		font-size: var(--small-size);
		padding-left: var(--padding);
		padding-right: var(--padding);
		background: var(--warning);
		color: var(--background);
	}

	.public {
		background: var(--salient);
		color: var(--background);
	}

	.org {
		background: var(--error);
		color: var(--background);
	}

	.admin {
		background: var(--foreground);
		color: var(--background);
	}
</style>
