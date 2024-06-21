<script lang="ts">
	import type { PostgrestError } from '@supabase/supabase-js';
	import { type Visibility as Vis } from '../database/OrganizationsDB';
	import Choice from './Choice.svelte';

	export let level: Vis;
	export let edit: undefined | ((level: string) => Promise<PostgrestError | null> | undefined) =
		undefined;
</script>

<Choice
	choice={level}
	choices={{
		public: 'Anyone on the internet can see this organization',
		org: 'Only people with a role in this organization can see this',
		admin: 'Only administrators can see this'
	}}
	{edit}>{level}</Choice
>
