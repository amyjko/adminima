<script lang="ts">
	import Paragraph from '$lib/Paragraph.svelte';
	import Header from '$lib/Header.svelte';
	import Page from '$lib/Page.svelte';
	import Link from '../lib/Link.svelte';
	import { locale } from '../types/Locales';
	import Text from '$lib/Text.svelte';
	import Lead from '$lib/Lead.svelte';
</script>

<Page>
	<Header>⎋ <Text text={$locale?.name} /></Header>
	<Lead><Text text={$locale?.landing.value} /></Lead>
	<Paragraph><Text text={$locale?.landing.description} /></Paragraph>
	<Paragraph
		><Link external to="https://amyjko.phd">Amy</Link> is working on it. <Link
			to="mailto:ajko@uw.edu">Write her</Link
		> if you're curious.</Paragraph
	>
</Page>
