<script>
	import Page from '$lib/Page.svelte';
</script>

<Page>
	<slot />
</Page>

<style>
	/** CSS reset */

	:root {
		font-family: var(--font);
		font-size: var(--normal-size);
		line-height: 1.4;

		--font: 'Rokkitt', sans-serif;
		--spacing: 1.25em;
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
		--focus: #784ada;
		--background: #ffffff;
		--separator: #cccccc;
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

	@font-face {
		font-family: 'Rokkitt';
		src: url(/fonts/Rokkitt.ttf) format('truetype');
	}
</style>
