<script lang="ts">
	import { page } from '$app/state';
	import { type Snippet } from 'svelte';
	import {
		ChangeSymbol,
		OrganizationSymbol,
		PersonSymbol,
		ProcessSymbol,
		RoleSymbol,
		TeamSymbol
	} from './Symbols';

	interface Props {
		to: string;
		bland?: boolean;
		title?: string | undefined;
		kind?: 'person' | 'role' | 'process' | 'org' | 'team' | 'change' | null;
		icon?: string;
		wrap?: boolean;
		children: Snippet;
		action?: Snippet;
	}

	let {
		to,
		bland = false,
		title = undefined,
		kind = null,
		icon,
		wrap,
		children,
		action
	}: Props = $props();

	let external = $derived(to.startsWith('http'));
	let inactive = $derived(to === page.url.pathname);
</script>

<a
	class={kind}
	class:inactive
	class:bland
	class:wrap
	{title}
	class:kinded={kind !== null}
	class:external
	href={inactive ? null : to}
	target={external ? '_blank' : ''}
>
	{#if icon || kind}
		<span class="emoji">
			{#if icon}
				{icon}
			{:else if kind === 'person'}
				{PersonSymbol}
			{:else if kind === 'role'}
				{RoleSymbol}
			{:else if kind === 'process'}
				{ProcessSymbol}
			{:else if kind === 'org'}
				{OrganizationSymbol}
			{:else if kind === 'change'}
				{ChangeSymbol}
			{:else if kind === 'team'}
				{TeamSymbol}
			{/if}
		</span>
	{/if}
	<span class="label">
		{@render children()}
	</span>
</a>
{@render action?.()}

<style>
	.link {
		display: inline-flex;
		flex-direction: row;
		align-items: baseline;
		gap: var(--padding);
	}
	a {
		color: currentColor;
		transition: transform 200ms;
		display: inline-flex;
		align-items: baseline;
		border-radius: var(--padding);
		font-size: inherit;
		gap: var(--padding);
	}

	.label {
		text-decoration-style: none;
		text-decoration-thickness: var(--thickness);
		text-decoration-skip-ink: none;
		display: inline-flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		gap: var(--padding);
	}

	a.inactive {
		text-decoration: none;
		cursor: default;
		background: none;
		color: currentColor;
		box-shadow: none;
	}

	a.bland {
		color: var(--background);
	}

	a:hover:not(.inactive),
	a:focus:not(.inactive) {
		transform-origin: center;
		transform: rotate(-1deg);
	}

	a:hover:not(.inactive) .label,
	a:focus:not(.inactive) .label {
		text-decoration-line: underline;
	}

	a:focus {
		outline: var(--thickness) solid var(--focus);
	}

	.kinded {
		color: var(--foreground);
		white-space: nowrap;
		text-decoration: none;
	}

	.wrap {
		white-space: wrap;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
	}

	.kinded.inactive .emoji {
		background: none;
	}

	.person .emoji {
		background-color: var(--person);
	}

	.person .label {
		text-decoration-color: var(--person);
	}

	.role .emoji {
		background-color: var(--warning);
	}

	.role .label {
		text-decoration-color: var(--warning);
	}

	.process .emoji {
		background-color: var(--error);
	}
	.process .label {
		text-decoration-color: var(--error);
	}

	.org .emoji {
		background-color: var(--foreground);
	}

	.change .emoji {
		background-color: var(--salient);
	}
	.change .label {
		text-decoration-color: var(--salient);
	}

	.team .emoji {
		background-color: var(--foreground);
	}
	.team .label {
		text-decoration-color: var(--foreground);
	}

	.emoji {
		display: inline-flex;
		height: 1em;
		width: 1em;
		border-radius: 50%;
		padding: 0.25em;
		justify-content: center;
		align-items: baseline;
		font-size: 60%;
		box-shadow: var(--border) 1px 1px;
		color: var(--background);
		user-select: none;
	}
</style>
