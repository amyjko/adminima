<!-- Represents ARCI for a processes's how to -->
<script lang="ts">
	import type { HowRow, ProcessRow } from '$database/OrganizationsDB';
	import Button from './Button.svelte';
	import Level from './Level.svelte';
	import RoleLink from './RoleLink.svelte';
	import Select from './Select.svelte';
	import { getDB, getOrg } from './contexts';

	export let how: HowRow;
	export let process: ProcessRow;

	const org = getOrg();
	const db = getDB();

	$: options = [
		{ value: undefined, label: '▼' },
		...$org
			.getRoles()
			.filter(
				(r) =>
					!how.responsible.includes(r.id) &&
					!how.consulted.includes(r.id) &&
					!how.informed.includes(r.id) &&
					r.id !== process.accountable
			)
			.map((role) => {
				return { value: role.id, label: role.title };
			})
	];

	let responsible: string | undefined = undefined;
	let consulted: string | undefined = undefined;
	let informed: string | undefined = undefined;
</script>

<div class="arci">
	<Level level="responsible" />
	{#each how.responsible as responsible}
		<RoleLink roleID={responsible} />
		<Button
			tip="Remove this role from the responsible list."
			action={() => $db.removeHowRCI(how, responsible, 'responsible')}>×</Button
		>
	{/each}
	{#if options.length > 0}
		<Select
			tip="Add a role to be responsible for completing this step."
			{options}
			fit={false}
			bind:selection={responsible}
			change={(value) => {
				if (value) {
					$db.addHowRCI(how, value, 'responsible');
					responsible = undefined;
				}
			}}
		/>
	{/if}
	<Level level="consulted" />
	{#each how.consulted as consulted}
		<RoleLink roleID={consulted} />
		<Button
			tip="Remove this role from the consulted list."
			action={() => $db.removeHowRCI(how, consulted, 'consulted')}>×</Button
		>
	{/each}
	{#if options.length > 0}
		<Select
			tip="Add a role to be consulted in this step."
			{options}
			bind:selection={consulted}
			fit={false}
			change={(value) => {
				if (value) {
					$db.addHowRCI(how, value, 'consulted');
					consulted = undefined;
				}
			}}
		/>
	{/if}
	<Level level="informed" />
	{#each how.informed as informed}
		<RoleLink roleID={informed} />
		<Button
			tip="Remove this role from the informed list"
			action={() => $db.removeHowRCI(how, informed, 'informed')}>×</Button
		>
	{/each}
	{#if options.length > 0}
		<Select
			tip="Add a role to be informed in this step."
			{options}
			bind:selection={informed}
			fit={false}
			change={(value) => {
				if (value) {
					$db.addHowRCI(how, value, 'informed');
					informed = undefined;
				}
			}}
		/>
	{/if}
</div>

<style>
	.arci {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--padding);
	}
</style>
