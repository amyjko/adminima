<!-- Represents ARCI for a processes's how to -->
<script lang="ts">
	import type { HowRow } from '$database/OrganizationsDB';
	import Button, { Delete } from './Button.svelte';
	import Level from './Level.svelte';
	import RoleLink, { RoleItem } from './RoleLink.svelte';
	import { getOrg } from '$routes/+layout.svelte';
	import { getDB } from '$routes/+layout.svelte';
	import Options from './Options.svelte';

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
				return role.id;
			})
	]);

	let responsible: string | undefined = $state(undefined);
	let consulted: string | undefined = $state(undefined);
	let informed: string | undefined = $state(undefined);

	let roleSearch = {
		placeholder: 'role',
		include: (item: string, query: string) => {
			const role = org.getRole(item);
			return role?.title.toLowerCase().includes(query.toLowerCase()) ?? false;
		}
	};
</script>

<div class="arci" class:verbose>
	<div class="slot">
		<div class="control">
			{#if !verbose}
				<Level level="responsible" />
			{/if}
			{#if editable}
				<Options
					id="responsible-chooser"
					tip="Add a role to be responsible for completing this step."
					{options}
					view={RoleItem}
					empty={false}
					searchable={roleSearch}
					active={options.length >= 1}
					bind:selection={responsible}
					change={async (value) => {
						if (value) {
							const error = await db.addHowRCI(how, value, 'responsible');
							if (error) return false;
							responsible = undefined;
						}
						return true;
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
				<Options
					id="consulted-chooser"
					tip="Add a role to be consulted in this step."
					{options}
					view={RoleItem}
					empty={false}
					active={options.length >= 1}
					bind:selection={consulted}
					searchable={roleSearch}
					change={async (value) => {
						if (value) {
							const error = await db.addHowRCI(how, value, 'consulted');
							if (error) return false;
							consulted = undefined;
						}
						return true;
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
				<Options
					id="informed-chooser"
					tip="Add a role to be informed in this step."
					{options}
					view={RoleItem}
					empty={false}
					searchable={roleSearch}
					bind:selection={informed}
					active={options.length >= 1}
					change={async (value) => {
						if (value) {
							const error = await db.addHowRCI(how, value, 'informed');
							if (error) return false;
							informed = undefined;
						}
						return true;
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
