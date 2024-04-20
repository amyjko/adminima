<script lang="ts">
	import type Revision from '../types/Revision';
	import PersonLink from './PersonLink.svelte';
	import MarkupView from './MarkupView.svelte';
	import Row from './Row.svelte';
	import Rows from './Rows.svelte';
	import Header from './Header.svelte';
	import { format } from 'date-fns';
	import Paragraph from './Paragraph.svelte';
	import { getOrg } from './contexts';

	export let mods: Revision[];

	const org = getOrg();
</script>

<Header>Revision history</Header>

<Rows>
	{#each mods as change}
		<Row name={format(change.when, 'MM/dd/yyyy')}>
			<Paragraph><PersonLink person={$org.getPerson(change.person)} /></Paragraph>
			<MarkupView markup={change.what} />
			<em><MarkupView markup={change.why} /></em>
		</Row>
	{:else}
		No revision history.
	{/each}
</Rows>
