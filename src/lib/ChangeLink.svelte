<script lang="ts">
	import type { ProcessID, RoleID, ChangeID } from '$types/Organization';
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import { getOrg } from '$routes/+layout.svelte';

	interface Props {
		id: ChangeID | null;
		role?: RoleID | null;
		process?: ProcessID | null;
		wrap?: boolean;
	}

	let { id, role = null, process = null, wrap }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);

	let change = $derived(id ? org.getChange(id) : null);
</script>

{#if id !== null && change === null}<Oops inline text="Unknown change" />{:else}<Link
		{wrap}
		kind="change"
		to="/org/{org.getPath()}/{id ? 'change' : 'changes'}/{id ?? 'new'}{role
			? `?role=${role}`
			: ''}{process ? `?process=${process}` : ''}"
		>{change
			? change.what.length > 100
				? `${change.what.substring(0, 100)}...`
				: change.what
			: 'Suggest a change...'}</Link
	>{/if}
