<script lang="ts">
	import type { MutationResult } from '$database/Organization';
	import EditableText from './EditableText.svelte';
	import Flow from './Flow.svelte';

	interface Props {
		short: string;
		path: string;
		update: (text: string) => Promise<MutationResult>;
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
