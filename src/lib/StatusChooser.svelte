<script lang="ts">
	import Select from './Select.svelte';
	import { isStatus, Statuses, type StatusType } from './status';

	interface Props {
		tip: string;
		change: (value: StatusType | undefined) => any;
		none: boolean;
		value: string | undefined;
	}

	let { tip, change, none, value }: Props = $props();
</script>

<Select
	{tip}
	selection={value}
	options={[
		...(none ? [{ value: undefined, label: 'All' }] : []),
		...Object.entries(Statuses).map(([key, value]) => ({ value: key, label: value }))
	]}
	change={(value) => change(value === undefined ? undefined : isStatus(value) ? value : undefined)}
/>
