<script lang="ts">
	import type Person from '../types/Person';
	import Header from './Header.svelte';
	import database from '../database/Database';
	import Loading from './Loading.svelte';
	import RoleLink from './RoleLink.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Paragraph from './Paragraph.svelte';
	import Flow from './Flow.svelte';

	export let person: Person;
</script>

<Title title={person.name} kind={$locale?.term.person} />

<Header>Roles</Header>
{#await database.getPersonRoles(person.id)}
	<Loading />
{:then roles}
	<Paragraph>Here are the roles this person has.</Paragraph>
	<Flow>
		{#each roles as role}
			<RoleLink roleID={role.id} />
		{/each}
	</Flow>
{/await}
