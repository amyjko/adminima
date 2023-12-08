<script lang="ts">
	import type { default as MarkupLink } from '../markup/Link';
	import Link from '$lib/Link.svelte';

	export let segment: MarkupLink;
</script>

<Link to={segment.url} external>{segment.text}</Link>
