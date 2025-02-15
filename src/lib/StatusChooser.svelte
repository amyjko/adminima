<script lang="ts">
	import Options from './Options.svelte';
	import { isStatus, Statuses, type StatusType } from './status';
	import Status from './Status.svelte';

	interface Props {
		tip: string;
		change: (value: StatusType | undefined) => any;
		none: boolean;
		value: string | undefined;
	}

	let { tip, change, none, value }: Props = $props();
</script>

{#snippet StatusItem(status: string | undefined)}
	{#if status}<Status {status}></Status>{:else}—{/if}
{/snippet}

<Options
	id="status-chooser"
	{tip}
	selection={value}
	view={StatusItem}
	options={[...(none ? [undefined] : []), ...Object.entries(Statuses).map(([key]) => key)]}
	change={(value) => change(value === undefined ? undefined : isStatus(value) ? value : undefined)}
/>
