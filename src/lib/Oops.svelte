<script lang="ts">
	import { locale, type Locale } from '../types/Locales';

	export let text: string | ((locale: Locale) => string);
	export let inline = false;
</script>

<div class:inline>{typeof text === 'string' ? text : $locale ? text($locale) : '-'}</div>

<style>
	div {
		display: inline-block;
		background: var(--error);
		color: var(--background);
		padding: var(--padding);
		border-spacing: var(--radius);
		margin-block-start: var(--spacing);
		margin-block-end: var(--spacing);
	}

	.inline {
		display: inline;
		padding-inline-start: calc(var(--spacing) / 2);
		padding-inline-end: calc(var(--spacing) / 2);
	}
</style>
