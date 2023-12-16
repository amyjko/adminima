<script lang="ts">
	import { locale, type Locale } from '../types/Locales';

	export let text: (locale: Locale) => string;
</script>

<div>{$locale ? text($locale) : '-'}</div>

<style>
	div {
		background: var(--error);
		color: var(--background);
	}
</style>
