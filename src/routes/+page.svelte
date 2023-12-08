<script lang="ts">
	import Paragraph from '$lib/Paragraph.svelte';
	import Header from '$lib/Header.svelte';
	import Page from '$lib/Page.svelte';
	import Link from '../lib/Link.svelte';
	import { locale } from '../types/Locales';
	import Text from '$lib/Text.svelte';
</script>

<Page>
	<Header><Text text={$locale?.name} /></Header>
	<Paragraph>This will soon be a place to help you administer periodic work.</Paragraph>
	<Paragraph
		><Link external to="https://amyjko.phd">Amy</Link> is working on it. <Link
			to="mailto:ajko@uw.edu">Write her</Link
		> if you're curious.</Paragraph
	>
</Page>
