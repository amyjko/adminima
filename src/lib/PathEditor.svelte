<script lang="ts">
	import type { PostgrestError } from '@supabase/supabase-js';
	import { getDB, getErrors, getOrg } from './contexts.svelte';
	import EditableText from './EditableText.svelte';
	import Flow from './Flow.svelte';

	interface Props {
		short: string;
		path: string;
		update: (text: string) => Promise<PostgrestError | null>;
	}

	let { short = $bindable(), path, update }: Props = $props();

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
