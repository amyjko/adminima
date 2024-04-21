<script lang="ts">
	import Link from './Link.svelte';
	import type Person from '../types/Person';
	import Oops from './Oops.svelte';
	import { getOrg } from './contexts';

	export let person: Person | null;
	export let short = false;
	export let email = false;

	const org = getOrg();
</script>

{#if person}
	<Link to="/organization/{$org.getID()}/person/{person.id}" kind="person"
		>{short ? person.name.split(' ')[0] : person.name}{#if email}
			&nbsp;&lt;{person.email}&gt;{/if}</Link
	>
{:else}
	<Oops inline text={(locale) => locale.error.noPerson} />
{/if}
