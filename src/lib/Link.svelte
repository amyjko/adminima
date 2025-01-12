<script lang="ts">
	import { page } from '$app/stores';
	import {
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
		children?: import('svelte').Snippet;
	}

	let { to, bland = false, title = undefined, kind = null, icon, wrap, children }: Props = $props();

	let external = $derived(to.startsWith('http'));
	let inactive = $derived(to === $page.url.pathname);
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
	><span class="emoji"
		>{#if icon}{icon}{:else if kind === 'person'}{PersonSymbol}{:else if kind === 'role'}{RoleSymbol}{:else if kind === 'process'}{ProcessSymbol}{:else if kind === 'org'}{OrganizationSymbol}{:else if kind === 'change'}𝚫{:else if kind === 'team'}{TeamSymbol}{/if}</span
	>
	{@render children?.()}</a
>

<style>
	a {
		color: currentColor;
		transition: transform 200ms;
		display: inline-block;
		border-radius: var(--padding);
		text-decoration: underline;
		text-decoration-color: var(--salient);
		text-decoration-thickness: var(--thickness);
		font-size: inherit;
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
		text-decoration-thickness: var(--thickness);
		text-decoration-skip-ink: none;
		transform-origin: center;
		transform: scaleY(1.1);
	}

	a:focus {
		outline: var(--thickness) solid var(--focus);
	}

	.kinded {
		color: var(--background);
		white-space: nowrap;
		padding-inline-start: var(--padding);
		padding-inline-end: var(--padding);
		text-decoration: none;
		box-shadow: var(--border) 1px 1px;
	}

	.wrap {
		white-space: wrap;
	}

	.kinded.inactive {
		box-shadow: none;
	}

	.person {
		background-color: var(--person);
	}

	.role {
		background-color: var(--warning);
	}

	.process {
		background-color: var(--error);
	}

	.org {
		background-color: var(--foreground);
	}

	.change {
		background-color: var(--salient);
	}

	.team {
		background-color: var(--foreground);
	}

	.emoji {
		font-size: 75%;
	}
</style>
