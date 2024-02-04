<script lang="ts">
	import { locale, type Locale } from '../types/Locales';

	export let text: (locale: Locale) => string;
	export let inline = false;
</script>

<div class:inline>{$locale ? text($locale) : '-'}</div>

<style>
	div {
		background: var(--error);
		color: var(--background);
	}

	.inline {
		display: inline;
		padding-inline-start: var(--spacing);
		padding-inline-end: var(--spacing);
	}
</style>
