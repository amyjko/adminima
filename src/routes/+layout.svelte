<script lang="ts">
	import Page from '$lib/Page.svelte';
	import { locale } from '$types/Locales';
	import { onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import {
		DBSymbol,
		ErrorsSymbol,
		UserSymbol,
		type DBContext,
		type ErrorsContext,
		type UserContext
	} from '$lib/contexts';
	import Organizations from '$database/OrganizationsDB.js';
	import Error from '$lib/Error.svelte';
	import { goto } from '$app/navigation';
	import Note from '$lib/Note.svelte';
	import Link from '$lib/Link.svelte';

	export let data;

	const db: DBContext = writable(new Organizations(data.supabase));
	setContext(DBSymbol, db);
	$: $db.setSupabaseClient(data.supabase);

	const user: UserContext = writable(null);
	setContext(UserSymbol, user);

	const errors: ErrorsContext = writable([]);
	setContext(ErrorsSymbol, errors);

	$: ({ strings, supabase } = data);
	$: locale.set(strings);

	onMount(() => {
		const subscription = supabase.auth.onAuthStateChange(async (newUser) => {
			if (newUser === 'SIGNED_OUT') {
				user.set(null);
				goto('/login');
			} else {
				const {
					data: { user: latestUser }
				} = await supabase.auth.getUser();
				// Update the user.
				user.set(latestUser);
			}
		});

		// call unsubscribe to remove the callback
		return () => {
			subscription.data.subscription.unsubscribe();
		};
	});
</script>

<div class="errors">
	{#each $errors as error}
		<Error {error} />
	{/each}
</div>
<Page>
	<slot />

	<hr />

	<Note
		><Link to="https://amyjko.phd">Amy</Link> built this. It's in <strong>beta</strong>. Have <Link
			to="https://github.com/amyjko/adminima/issues/new/choose">feedback</Link
		>?
	</Note>
</Page>

<style>
	/** CSS reset */

	:root {
		font-family: var(--font);
		font-size: var(--normal-size);
		line-height: 1.4;

		--font: 'Rokkitt', sans-serif;
		--spacing: 0.75rem;
		--thickness: 3px;
		--padding: 0.25rem;
		--radius: 4px;
		--normal-size: 18pt;
		--small-size: 14pt;
		--error: #e25f55;
		--warning: #e28d1d;
		--warning-background: #faecdc;
		--other: #b349cb;
		--salient: #d35088;
		--person: #238427;
		--focus: #784ada;
		--background: #ffffff;
		--chrome: #dfdfdf;
		--separator: #eeeeee;
		--inactive: #555555;
		--foreground: #000000;
		--border: var(--inactive);
		--thickness: 3px;
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
		max-width: 100%;
		overflow-x: scroll;
	}

	:global(strong) {
		font-weight: bold;
	}

	:global(em) {
		font-style: italic;
	}

	:global(hr) {
		border: none;
		border-top: var(--thickness) solid var(--separator);
		width: 100%;
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

	:global(tr:first-child) {
		border-top: var(--thickness) solid var(--border);
	}

	:global(input[type='text']) {
		border-radius: var(--radius);
		border: 2px solid var(--border);
		font-size: var(--normal-size);
		font-family: var(--font);
	}

	:global(textarea) {
		font-size: inherit;
		font-style: inherit;
		font-family: inherit;
		border: none;
		padding: var(--padding);
		outline: var(--border) solid var(--thickness);
		min-height: 1em;
		border-radius: var(--radius);
	}

	@font-face {
		font-family: 'Rokkitt';
		src: url(/fonts/Rokkitt.ttf) format('truetype');
	}

	.errors {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--padding);
		position: fixed;
		top: var(--padding);
		left: var(--padding);
		right: var(--padding);
		padding: var(--padding);
		background-color: transparent;
		text-align: center;
		z-index: 2;
	}

	:global(code) {
		font-family: monospace;
		font-size: var(--small-size);
	}

	:global(h3) {
		font-size: 20pt;
		font-weight: bold;
	}

	:global(h4) {
		font-size: 18pt;
		font-style: italic;
	}
</style>
