<script lang="ts">
	import writeXlsxFile, { type SheetData } from 'write-excel-file';
	import Button from './Button.svelte';
	import Tip from './Tip.svelte';
	import { getOrg } from './contexts.svelte';
	import type { HowRow } from '$database/OrganizationsDB';

	const context = getOrg();
	let org = $derived(context.org);

	function howToString(how: HowRow, depth = 0): string {
		return `\n${'\t'.repeat(depth)}${depth > 0 ? '•' : ''} ${how.what}${how.how.map((id) => {
			const child = org.getHow(id);
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
			...org.getRoles().map((role) => {
				return {
					value: `${role.title} | ${org.getRoleProfiles(role.id).map((prof) => prof.email)}`,
					fontWeight: 'bold' as const,
					textRotation: 90
				};
			})
		];

		const processRows = org.getProcesses().map((process) => {
			const how = process.howid ? org.getHow(process.howid) : undefined;
			return [
				{ value: process.title, wrap: true, alignVertical: 'top' as const },
				{
					value: how ? howToString(how).trim() : '',
					wrap: true,
					alignVertical: 'top' as const
				},
				...org.getRoles().map((role) => {
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
				...org.getRoles().map(() => {
					return { width: 3 };
				})
			],
			fileName: 'export.xlsx'
		});
	}
</script>

<Tip
	>You can export your data at any time. The export will generate a <code>.xlsx</code> spreadsheet of
	processes in rows, with a description column summarizing the steps and then columns for each role the
	organization (with the names of who holds each), and ARCI in cells. Comment histories will not be exported.</Tip
>
<Button tip="Export the organization" action={exportOrg}>Export…</Button>
