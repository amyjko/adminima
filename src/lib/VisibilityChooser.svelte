<script lang="ts">
	import type { PostgrestError } from '@supabase/supabase-js';
	import { type Visibility } from '../database/OrganizationsDB';
	import Options from './Options.svelte';
	import Vis from './Visibility.svelte';

	interface Props {
		level: Visibility;
		tip: string;
		edit?: undefined | ((level: string) => Promise<PostgrestError | null> | undefined);
	}

	let { level, tip, edit = undefined }: Props = $props();

	const opts: { value: Visibility; label: string }[] = [
		{ value: 'public', label: 'public' },
		{ value: 'org', label: 'org' },
		{ value: 'admin', label: 'admins' }
	] as const;
</script>

{#snippet viz(visibility: string | undefined)}
	{#if visibility}
		<Vis state={visibility}></Vis>
	{/if}
{/snippet}

{#if edit}
	<Options
		{tip}
		selection={level}
		options={opts.map((o) => o.value)}
		change={async (value) => (value ? (await edit(value)) === null : true)}
		id="visibility"
		view={viz}
	></Options>
{:else}
	<div class="status">
		{@render viz(level)}
	</div>
{/if}

<style>
	.status {
		display: inline-block;
	}
</style>
