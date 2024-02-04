<script lang="ts">
	import { onMount } from 'svelte';
	import type { PersonID } from '../types/Person';
	import Link from './Link.svelte';
	import database from '../database/Database';
	import type Person from '../types/Person';
	import Loading from './Loading.svelte';
	import Oops from './Oops.svelte';

	export let personID: PersonID;
	export let short = false;

	let person: Person | null | undefined = null;

	onMount(async () => {
		person = await database.getPerson(personID);
	});
</script>

{#if person === null}<Loading />{:else if person === undefined}<Oops
		inline
		text={(locale) => locale.error.noPerson}
	/>{:else}<Link to="/person/{personID}">{short ? person.name.split(' ')[0] : person.name}</Link
	>{/if}
