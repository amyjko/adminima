<script>
	import Title from '$lib/Title.svelte';
	import { page } from '$app/state';
</script>

<Title title="Oops..."></Title>

<p>{page.error?.message ?? 'An unknown error occurred.'}</p>
