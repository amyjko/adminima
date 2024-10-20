<script lang="ts">
	import type { PostgrestError } from '@supabase/supabase-js';
	import EditableText from './EditableText.svelte';
	import Flow from './Flow.svelte';

	interface Props {
		short: string;
		path: string;
		update: (text: string) => Promise<PostgrestError | null>;
	}

	let { short = $bindable(), path, update }: Props = $props();
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
