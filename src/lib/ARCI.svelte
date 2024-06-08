<!-- Represents ARCH for a processes's how to -->
<script lang="ts">
	import type { HowRow } from '$database/Organizations';
	import Organizations from '$database/Organizations';
	import Button from './Button.svelte';
	import Level from './Level.svelte';
	import RoleLink from './RoleLink.svelte';
	import Select from './Select.svelte';
	import { getOrg } from './contexts';

	export let how: HowRow;

	const org = getOrg();

	$: options = [
		{ value: undefined, label: '▼' },
		...$org
			.getRoles()
			.filter((r) => !how.responsible.includes(r.id))
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
		<Button action={() => Organizations.removeHowRCI(how, responsible, 'responsible')}>×</Button>
	{/each}
	{#if options.length > 0}
		<Select
			{options}
			fit={false}
			bind:selection={responsible}
			change={(value) => {
				if (value) {
					Organizations.addHowRCI(how, value, 'responsible');
					responsible = undefined;
				}
			}}
		/>
	{/if}
	<Level level="consulted" />
	{#each how.consulted as consulted}
		<RoleLink roleID={consulted} />
		<Button action={() => Organizations.removeHowRCI(how, consulted, 'consulted')}>×</Button>
	{/each}
	{#if options.length > 0}
		<Select
			{options}
			bind:selection={consulted}
			fit={false}
			change={(value) => {
				if (value) {
					Organizations.addHowRCI(how, value, 'consulted');
					consulted = undefined;
				}
			}}
		/>
	{/if}
	<Level level="informed" />
	{#each how.informed as informed}
		<RoleLink roleID={informed} />
		<Button action={() => Organizations.removeHowRCI(how, informed, 'informed')}>×</Button>
	{/each}
	{#if options.length > 0}
		<Select
			{options}
			bind:selection={informed}
			fit={false}
			change={(value) => {
				if (value) {
					Organizations.addHowRCI(how, value, 'informed');
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
