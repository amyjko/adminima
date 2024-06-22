<script lang="ts">
	import type { PostgrestError } from '@supabase/supabase-js';
	import { type Visibility as Vis } from '../database/OrganizationsDB';
	import Select from './Select.svelte';

	export let level: Vis;
	export let tip: string;
	export let edit: undefined | ((level: string) => Promise<PostgrestError | null> | undefined) =
		undefined;
</script>

{level}
{#if edit}
	<Select
		{tip}
		selection={level}
		options={[
			{ value: 'public', label: 'public' },
			{ value: 'org', label: 'members only' },
			{ value: 'admin', label: 'administrators' }
		]}
		change={(value) => (value ? edit(value) : undefined)}
	/>
{/if}
