<!-- Represents ARCI for a processes's how to -->
<script lang="ts">
	import type { HowRow, ProcessRow } from '$database/OrganizationsDB';
	import Button, { Delete } from './Button.svelte';
	import Level from './Level.svelte';
	import RoleLink from './RoleLink.svelte';
	import Select from './Select.svelte';
	import { getDB, getOrg } from './contexts';

	export let how: HowRow;
	export let process: ProcessRow;
	export let verbose: boolean;

	const org = getOrg();
	const db = getDB();

	$: options = [
		{ value: undefined, label: '—' },
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

<div class="arci" class:verbose>
	<div class="slot">
		{#if !verbose}
			<Level level="responsible" />
		{/if}
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
		{#each how.responsible as responsible}
			<RoleLink roleID={responsible} />
			<Button
				tip="Remove this role from the responsible list."
				action={() => $db.removeHowRCI(how, responsible, 'responsible')}>{Delete}</Button
			>
		{/each}
		{#if verbose}
			is <Level level="responsible" verbose /> for completing this process.
		{/if}
	</div>
	<div class="slot">
		{#if !verbose}
			<Level level="consulted" />
		{/if}
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
		{#each how.consulted as consulted}
			<RoleLink roleID={consulted} />
			<Button
				tip="Remove this role from the consulted list."
				action={() => $db.removeHowRCI(how, consulted, 'consulted')}>{Delete}</Button
			>
		{/each}
		{#if verbose}
			is <Level level="consulted" verbose /> to complete this process.
		{/if}
	</div>
	<div class="slot">
		{#if !verbose}
			<Level level="informed" />
		{/if}
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
		{#each how.informed as informed}
			<RoleLink roleID={informed} />
			<Button
				tip="Remove this role from the informed list"
				action={() => $db.removeHowRCI(how, informed, 'informed')}>{Delete}</Button
			>
		{/each}
		{#if verbose}
			is <Level level="informed" verbose /> about this process and its outcomes.
		{/if}
	</div>
</div>

<style>
	.arci {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--spacing);
	}

	.slot {
		display: inline;
	}

	.verbose {
		flex-direction: column;
		align-items: start;
		gap: calc(1.5 * var(--spacing));
	}
</style>
