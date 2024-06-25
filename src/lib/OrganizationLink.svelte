<script lang="ts">
	import Link from './Link.svelte';
	import { type OrganizationID } from '$types/Organization';
	import { navigating } from '$app/stores';
	import Loading from './Loading.svelte';

	export let id: OrganizationID;
	export let name: string;
</script>

{#if $navigating}
	<Loading />
{:else}
	<Link to="/org/{id}" kind="org">{name}</Link>
{/if}
