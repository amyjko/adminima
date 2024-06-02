<script lang="ts">
	import { locale, type Locale } from '../types/Locales';

	export let text: string | ((locale: Locale) => string);
	export let inline = false;
</script>

<div class:inline>{typeof text === 'string' ? text : $locale ? text($locale) : '-'}</div>

<style>
	div {
		display: block;
		background: var(--error);
		text-transform: none;
		font-size: var(--normal-size);
		color: var(--background);
		padding: var(--padding);
		border-spacing: var(--radius);
		margin-block-start: var(--spacing);
		margin-block-end: var(--spacing);
	}

	.inline {
		display: inline;
		margin: 0;
		padding-inline-start: calc(var(--spacing) / 2);
		padding-inline-end: calc(var(--spacing) / 2);
	}
</style>
