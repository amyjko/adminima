<script lang="ts">
	import type { ProcessID, RoleID, ChangeID } from '$types/Organization';
	import Link from './Link.svelte';
	import Oops from './Oops.svelte';
	import { getOrg } from './contexts';

	export let id: ChangeID | null;
	export let role: RoleID | null = null;
	export let process: ProcessID | null = null;

	const org = getOrg();

	$: change = id ? $org.getChange(id) : null;
</script>

{#if id !== null && change === null}<Oops inline text="Unknown change" />{:else}<Link
		kind="change"
		to="/org/{$org.getPath()}/{id ? 'change' : 'changes'}/{id ?? 'new'}{role
			? `?role=${role}`
			: ''}{process ? `?process=${process}` : ''}"
		>{change ? change.what : 'Suggest a change...'}</Link
	>{/if}
