<script lang="ts">
	import type { PostgrestError } from '@supabase/supabase-js';
	import { getDB, getErrors, getOrg } from './contexts';
	import EditableText from './EditableText.svelte';
	import Flow from './Flow.svelte';

	export let short: string;
	export let path: string;
	export let update: (text: string) => Promise<PostgrestError | null>;

	const errors = getErrors();
	const db = getDB();
	const org = getOrg();
</script>

<code
	><Flow spaced={false}
		>{path}<EditableText
			bind:text={short}
			transform={(text) => text.trim().replaceAll(' ', '')}
			edit={update}
		/></Flow
	></code
>
