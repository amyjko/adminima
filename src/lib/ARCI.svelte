<!-- Represents ARCI for a processes's how to -->
<script lang="ts">
	import type { HowRow } from '$database/OrganizationsDB';
	import Button, { Delete } from './Button.svelte';
	import Level from './Level.svelte';
	import RoleLink from './RoleLink.svelte';
	import Select from './Select.svelte';
	import { getDB, getOrg } from './contexts.svelte';

	interface Props {
		how: HowRow;
		verbose: boolean;
		editable: boolean;
	}

	let { how, verbose, editable }: Props = $props();

	const context = getOrg();
	let org = $derived(context.org);

	const db = getDB();

	let options = $derived([
		{ value: undefined, label: '▼' },
		...org
			.getRoles()
			// Exclude any alreaydy included in the how.
			.filter(
				(r) =>
					!how.responsible.includes(r.id) &&
					!how.consulted.includes(r.id) &&
					!how.informed.includes(r.id)
			)
			// Sort by ttile.
			.toSorted((a, b) => a.title.localeCompare(b.title))
			// Map to select options.
			.map((role) => {
				return { value: role.id, label: role.title };
			})
	]);

	let responsible: string | undefined = $state(undefined);
	let consulted: string | undefined = $state(undefined);
	let informed: string | undefined = $state(undefined);
</script>

<div class="arci" class:verbose>
	<div class="slot">
		<div class="control">
			{#if !verbose}
				<Level level="responsible" />
			{/if}
			{#if editable}
				<Select
					tip="Add a role to be responsible for completing this step."
					{options}
					fit={false}
					active={options.length > 1}
					bind:selection={responsible}
					change={(value) => {
						if (value) {
							db.addHowRCI(how, value, 'responsible');
							responsible = undefined;
						}
					}}
				/>
			{/if}
		</div>
		<div class="roles">
			{#each how.responsible as responsible}
				<RoleLink roleID={responsible}
					>{#if editable}
						<Button
							chromeless
							tip="Remove this role from the responsible list."
							action={() => db.removeHowRCI(how, responsible, 'responsible')}>{Delete}</Button
						>
					{/if}</RoleLink
				>
			{/each}
			{#if verbose}
				is <Level level="responsible" verbose /> for completing this process.
			{/if}
		</div>
	</div>
	<div class="slot">
		<div class="control">
			{#if !verbose}
				<Level level="consulted" />
			{/if}
			{#if editable}
				<Select
					tip="Add a role to be consulted in this step."
					{options}
					active={options.length > 1}
					bind:selection={consulted}
					fit={false}
					change={(value) => {
						if (value) {
							db.addHowRCI(how, value, 'consulted');
							consulted = undefined;
						}
					}}
				/>
			{/if}
		</div>
		<div class="roles">
			{#each how.consulted as consulted}
				<RoleLink roleID={consulted}
					>{#if editable}
						<Button
							chromeless
							tip="Remove this role from the consulted list."
							action={() => db.removeHowRCI(how, consulted, 'consulted')}>{Delete}</Button
						>
					{/if}</RoleLink
				>
			{/each}
			{#if verbose}
				is <Level level="consulted" verbose /> to complete this process.
			{/if}
		</div>
	</div>
	<div class="slot">
		<div class="controls">
			{#if !verbose}
				<Level level="informed" />
			{/if}
			{#if editable}
				<Select
					tip="Add a role to be informed in this step."
					{options}
					bind:selection={informed}
					active={options.length > 1}
					fit={false}
					change={(value) => {
						if (value) {
							db.addHowRCI(how, value, 'informed');
							informed = undefined;
						}
					}}
				/>
			{/if}
		</div>
		<div class="roles">
			{#each how.informed as informed}
				<RoleLink roleID={informed}
					>{#if editable}
						<Button
							chromeless
							tip="Remove this role from the informed list"
							action={() => db.removeHowRCI(how, informed, 'informed')}>{Delete}</Button
						>
					{/if}</RoleLink
				>
			{/each}
			{#if verbose}
				is <Level level="informed" verbose /> about this process and its outcomes.
			{/if}
		</div>
	</div>
</div>

<style>
	.arci {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		gap: calc(var(--spacing) / 2);
		row-gap: calc(var(--spacing) / 2);
		font-size: var(--small-size);
	}

	.slot {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: calc(var(--spacing) / 2);
		align-items: baseline;
	}

	.control {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: calc(var(--spacing) / 2);
	}

	.roles {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		gap: calc(var(--spacing) / 2);
	}

	.verbose {
		flex-direction: column;
		align-items: start;
		gap: calc(1.5 * var(--spacing));
	}
</style>
