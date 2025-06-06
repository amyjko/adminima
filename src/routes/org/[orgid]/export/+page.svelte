<script lang="ts">
	import writeXlsxFile, { type SheetData } from 'write-excel-file';
	import Button from '$lib/Button.svelte';
	import Tip from '$lib/Tip.svelte';
	import type { HowRow } from '$database/Organization';
	import Organization from '$database/Organization';
	import Title from '$lib/Title.svelte';

	const { data } = $props();

	const org = $derived(data.org);
	const roles = $derived(data.roles);
	const processes = $derived(data.processes);
	const hows = $derived(data.hows);
	const assignments = $derived(data.assignments);
	const profiles = $derived(data.profiles);

	function howToString(how: HowRow, depth = 0): string {
		return `\n${'\t'.repeat(depth)}${depth > 0 ? '•' : ''} ${how.what}${how.how.map((id) => {
			const child = Organization.getHow(hows, id);
			if (child) return howToString(child, depth + 1);
			else return '';
		})}`;
	}

	async function exportOrg() {
		const headers = [
			{
				value: 'Process',
				fontWeight: 'bold' as const
			},
			{
				value: 'How',
				fontWeight: 'bold' as const
			},
			...roles.map((role) => {
				return {
					value: `${role.title} | ${Organization.getRoleProfiles(role.id, assignments, profiles).map((prof) => prof.email)}`,
					fontWeight: 'bold' as const,
					textRotation: 90
				};
			})
		];

		const processRows = processes.map((process) => {
			const how = process.howid ? Organization.getHow(hows, process.howid) : undefined;
			return [
				{ value: process.title, wrap: true, alignVertical: 'top' as const },
				{
					value: how ? howToString(how).trim() : '',
					wrap: true,
					alignVertical: 'top' as const
				},
				...roles.map((role) => {
					return {
						alignVertical: 'top' as const,
						value:
							process.accountable === role.id
								? 'A'
								: how
									? how.responsible.includes(role.id)
										? 'R'
										: how.consulted.includes(role.id)
											? 'C'
											: how.informed.includes(role.id)
												? 'I'
												: ''
									: ''
					};
				})
			];
		});

		const data: SheetData = [headers, ...processRows];
		await writeXlsxFile(data, {
			columns: [
				{ width: 30 },
				{ width: 60 },
				...roles.map(() => {
					return { width: 3 };
				})
			],
			fileName: 'export.xlsx'
		});
	}
</script>

<Title title={org.name} kind="organization"></Title>

<Tip
	>You can export your data at any time. The export will generate a <code>.xlsx</code> spreadsheet of
	processes in rows, with a description column summarizing the steps and then columns for each role the
	organization (with the names of who holds each), and ARCI in cells. Comment histories will not be exported.</Tip
>
<Button tip="Export the organization" action={exportOrg}>Export…</Button>
