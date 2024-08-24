<script lang="ts">
	import { locale, type Locale } from '../types/Locales';

	export let text: string | ((locale: Locale) => string) | undefined = undefined;
	export let inline = false;
</script>

<div class:inline>
	<span>{typeof text === 'string' ? text : $locale && text ? text($locale) : '-'}</span>
	<span class="sub"><slot /></span>
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		background: var(--error);
		text-transform: none;
		font-size: var(--normal-size);
		color: var(--background);
		padding: calc(2 * var(--padding));
		border-spacing: var(--radius);
		max-width: 30em;
		text-align: left;
		border-radius: var(--radius);
	}

	.inline {
		display: inline;
		margin: 0;
		padding-inline-start: calc(var(--spacing) / 2);
		padding-inline-end: calc(var(--spacing) / 2);
	}

	.sub {
		font-size: var(--small-size);
	}
</style>
