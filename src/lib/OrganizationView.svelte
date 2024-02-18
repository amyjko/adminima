<script lang="ts">
	import type Organization from '../types/Organization';
	import MarkupView from './MarkupView.svelte';
	import Link from './Link.svelte';
	import Title from './Title.svelte';
	import { locale } from '$types/Locales';
	import Paragraph from './Paragraph.svelte';

	export let organization: Organization;
</script>

<Title title={organization.name} kind={$locale?.term.organization} />

<MarkupView markup={organization.description} />

<Paragraph>
	Learn what <Link to="{organization.id}/roles">Roles</Link> people have here.</Paragraph
>

<Paragraph
	>Find all of the <Link to="{organization.id}/people">People</Link> in this organization.</Paragraph
>

<Paragraph
	>See all of the <Link to="{organization.id}/processes">Processes</Link> that make this organization
	work.</Paragraph
>

<Paragraph
	>Suggest a <Link to="{organization.id}/changes">Change</Link> to make this organization work better.</Paragraph
>
