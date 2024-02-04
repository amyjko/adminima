<script lang="ts">
	import { onMount } from 'svelte';
	import Link from './Link.svelte';
	import database from '../database/Database';
	import Loading from './Loading.svelte';
	import Oops from './Oops.svelte';
	import { type RequestID } from '../types/Request';
	import type Request from '../types/Request';

	export let requestID: RequestID;

	let request: Request | null | undefined = null;

	onMount(async () => {
		request = await database.getRequest(requestID);
	});
</script>

{#if request === null}<Loading />{:else if request === undefined}<Oops
		inline
		text={(locale) => locale.error.noPerson}
	/>{:else}<Link to="/request/{requestID}">{request.title}</Link>{/if}
