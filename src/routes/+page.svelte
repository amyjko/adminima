<script lang="ts">
	import Paragraph from '$lib/Paragraph.svelte';
	import Header from '$lib/Header.svelte';
	import Page from '$lib/Page.svelte';
	import Link from '../lib/Link.svelte';
</script>

<Page>
	<Header>Adminima</Header>
	<Paragraph>This will soon be a place to help you administer periodic work.</Paragraph>
	<Paragraph
		><Link external to="https://amyjko.phd">Amy</Link> is working on it. <Link
			to="mailto:ajko@uw.edu">Write her</Link
		> if you're curious.</Paragraph
	>
</Page>
