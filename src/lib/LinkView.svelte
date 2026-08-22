<script lang="ts">
	import type { default as MarkupLink } from '../markup/Link';
	import Link from '$lib/Link.svelte';

	interface Props {
		segment: MarkupLink;
	}

	let { segment }: Props = $props();
</script>

<Link to={segment.url.startsWith('http') || segment.url.startsWith('/') ? segment.url : ''}
	>{segment.text.length === 0 ? '—' : segment.text}</Link
>
