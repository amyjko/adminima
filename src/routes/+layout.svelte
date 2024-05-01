<script lang="ts">
	import { dev } from '$app/environment';
	import Lead from '$lib/Lead.svelte';
	import Page from '$lib/Page.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import Text from '$lib/Text.svelte';
	import Link from '$lib/Link.svelte';
	import { locale, type Locale } from '$types/Locales';
	import { supabase } from '$lib/supabaseClient';
	import { onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { UserSymbol, type UserContext } from '$lib/contexts';

	export let data: { locale: Locale };

	locale.set(data.locale);

	const user: UserContext = writable(null);
	setContext(UserSymbol, user);

	const subscription = supabase.auth.onAuthStateChange((_, session) => {
		// Update the user.
		user.set(session?.user ?? null);
	});

	onMount(() => {
		// call unsubscribe to remove the callback
		return () => {
			subscription.data.subscription.unsubscribe();
		};
	});
</script>

<Page>
	{#if dev}
		<slot />
	{:else}
		<Title title="Adminima" visibility={null} />
		<Lead><Text text={$locale?.landing.value} /></Lead>
		<Paragraph><Text text={$locale?.landing.description} /></Paragraph>
		<Paragraph
			><Link external to="https://amyjko.phd">Amy</Link> is working on it. <Link
				to="mailto:ajko@uw.edu">Write her</Link
			> if you're curious. No launch date yet, but she aspires for Summer 2024.</Paragraph
		>
	{/if}
</Page>

<style>
	/** CSS reset */

	:root {
		font-family: var(--font);
		font-size: var(--normal-size);
		line-height: 1.4;

		--font: 'Rokkitt', sans-serif;
		--spacing: 1.25rem;
		--thickness: 3px;
		--padding: 0.2em;
		--radius: 4px;
		--normal-size: 18pt;
		--small-size: 13pt;
		--error: #e25f55;
		--warning: #e28d1d;
		--warning-background: #faecdc;
		--other: #b349cb;
		--salient: #d35088;
		--person: #238427;
		--focus: #784ada;
		--background: #ffffff;
		--separator: #eeeeee;
		--inactive: #555555;
		--foreground: #000000;
		--border: #000000;
		--thickness: 4px;
	}

	:global(
			html,
			body,
			div,
			span,
			applet,
			object,
			iframe,
			h1,
			h2,
			h3,
			h4,
			h5,
			h6,
			p,
			blockquote,
			pre,
			a,
			abbr,
			acronym,
			address,
			big,
			cite,
			code,
			del,
			dfn,
			em,
			img,
			ins,
			kbd,
			q,
			s,
			samp,
			small,
			strike,
			strong,
			sub,
			sup,
			tt,
			var,
			b,
			u,
			i,
			center,
			dl,
			dt,
			dd,
			ol,
			ul,
			li,
			fieldset,
			form,
			label,
			legend,
			table,
			caption,
			tbody,
			tfoot,
			thead,
			tr,
			th,
			td,
			article,
			aside,
			canvas,
			details,
			embed,
			figure,
			figcaption,
			footer,
			header,
			hgroup,
			menu,
			nav,
			output,
			ruby,
			section,
			summary,
			time,
			mark,
			audio,
			video
		) {
		margin: 0;
		padding: 0;
		border: 0;
		font-size: 100%;
		font: inherit;
		vertical-align: baseline;
	}
	:global(body) {
		padding: 0;
		margin: 0;
		background: var(--background);
		color: var(--foreground);
	}

	/* HTML5 display-role reset for older browsers */
	:global(article, aside, details, figcaption, figure, footer, header, hgroup, menu, nav, section) {
		display: block;
	}

	:global(ol, ul) {
		list-style: square;
		list-style-position: outside;
		margin-inline-start: var(--spacing);
	}

	:global(li) {
		margin-block-start: calc(var(--spacing) / 2);
		margin-block-end: calc(var(--spacing) / 2);
	}

	:global(blockquote, q) {
		quotes: none;
	}
	:global(blockquote:before, blockquote:after, q:before, q:after) {
		content: '';
		content: none;
	}
	:global(table) {
		border-collapse: collapse;
		border-spacing: 0;
	}

	:global(strong) {
		font-weight: bold;
	}

	:global(em) {
		font-style: italic;
	}

	:global(table) {
		width: 100%;
		border-collapse: collapse;
	}

	:global(th, td) {
		text-align: left;
		padding: var(--padding);
	}

	:global(th) {
		font-style: italic;
		border-bottom: var(--thickness) solid var(--border);
	}

	:global(tr:last-child) {
		border-bottom: var(--thickness) solid var(--border);
	}

	:global(input[type='text']) {
		border-radius: var(--radius);
		border: 2px solid var(--border);
		font-size: var(--normal-size);
		font-family: var(--font);
	}

	@font-face {
		font-family: 'Rokkitt';
		src: url(/fonts/Rokkitt.ttf) format('truetype');
	}
</style>
