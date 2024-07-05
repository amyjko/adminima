<script lang="ts">
	import Oops from '$lib/Oops.svelte';
	import Title from '$lib/Title.svelte';
	import { OrgSymbol, getDB } from '$lib/contexts';
	import { onMount, setContext } from 'svelte';

	export let data;

	$: ({ payload, user } = data);

	const db = getDB();

	// Save the payload in the database cache.
	$: org = data.payload ? $db.updateOrg(data.payload) : undefined;
	$: if (payload) setContext(OrgSymbol, org);
	onMount(() => {
		// When this layout mounts, listen to realtime changes on the organization payload.
		const orgid = data.payload?.organization.id;
		if (orgid) $db.subscribe(orgid);

		return () => {
			// When this layout unmounts, unsubscribe from the organization payload.
			if (orgid) $db.unsubscribe(orgid);
		};
	});
</script>

{#if $org}
	{#if $org.getVisibility() === 'public' || (user && (($org.getVisibility() === 'org' && $org.hasPerson(user.id)) || ($org.getVisibility() === 'admin' && $org.hasAdminPerson(user.id))))}
		<slot />
	{:else}
		<Title title="Oops" kind="organization" />
		<Oops text="This organization's details aren't visible to you." />
	{/if}
{:else}
	<Title title="Oops" kind="organization" />
	<Oops text="Organization not found." />
{/if}
