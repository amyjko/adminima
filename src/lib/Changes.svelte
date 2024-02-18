<script lang="ts">
	import type Change from '../types/Modification';
	import PersonLink from './PersonLink.svelte';
	import MarkupView from './MarkupView.svelte';
	import Row from './Row.svelte';
	import Rows from './Rows.svelte';
	import Header from './Header.svelte';
	import { format } from 'date-fns';
	import Paragraph from './Paragraph.svelte';

	export let changes: Change[];
</script>

<Header>Changes</Header>

<Rows>
	{#each changes as change}
		<Row name={format(change.time, 'MM/dd/yyyy')}>
			<Paragraph><PersonLink personID={change.person} /></Paragraph>
			<MarkupView markup={change.what} />
			<em><MarkupView markup={change.why} /></em>
		</Row>
	{:else}
		&mdash;
	{/each}
</Rows>
