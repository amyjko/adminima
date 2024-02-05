<script lang="ts">
	import { locale, type Locale } from '../types/Locales';

	export let text: string | ((locale: Locale) => string);
	export let inline = false;
</script>

<div class:inline>{typeof text === 'string' ? text : $locale ? text($locale) : '-'}</div>

<style>
	div {
		background: var(--error);
		color: var(--background);
	}

	.inline {
		display: inline;
		padding-inline-start: calc(var(--spacing) / 2);
		padding-inline-end: calc(var(--spacing) / 2);
	}
</style>
