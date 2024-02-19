<script lang="ts">
	import Link from './Link.svelte';
	import database from '../database/Database';
	import Loading from './Loading.svelte';
	import Oops from './Oops.svelte';
	import { type ChangeID } from '../types/Change';

	export let requestID: ChangeID;

	$: request = database.getChange(requestID);
</script>

{#if $request === null}<Loading />{:else if $request === undefined}<Oops
		inline
		text={(locale) => locale.error.noPerson}
	/>{:else}<Link to="/organization/{$request.organization}/change/{requestID}"
		>{$request.title}</Link
	>{/if}
