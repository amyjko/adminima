<script lang="ts">
	import type { RoleID } from '$database/Organization';
	import type { ProcessID } from '$database/Organization';
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import type { ChangeRow } from '$database/Organization';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import Organization from '$database/Organization';

	interface Props {
		change: ChangeRow | null | undefined;
		role?: RoleID | null;
		process?: ProcessID | null;
		wrap?: boolean;
	}

	let { change, role = null, process = null, wrap }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);
</script>

{#if change === undefined}<Oops inline text="Unknown change" />{:else}<Link
		{wrap}
		kind="change"
		to="/org/{Organization.getPath(org)}/{change ? 'change' : 'changes'}/{change
			? change.id
			: 'new'}{role ? `?role=${role}` : ''}{process ? `?process=${process}` : ''}"
		>{change
			? change.what.length > 100
				? `${change.what.substring(0, 100)}...`
				: change.what
			: 'Suggest a change...'}</Link
	>{/if}
