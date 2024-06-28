<script lang="ts">
	import { page } from '$app/stores';

	export let to: string;
	export let bland = false;
	export let kind: 'person' | 'role' | 'process' | 'org' | 'team' | 'suggestion' | null = null;

	$: external = to.startsWith('http');
	$: inactive = to === $page.url.pathname;
</script>

<a
	class={kind}
	class:inactive
	class:bland
	class:kinded={kind !== null}
	class:external
	href={inactive ? null : to}
	target={external ? '_blank' : ''}
	><span class="emoji"
		>{#if kind === 'person'}⍜{:else if kind === 'role'}☑{:else if kind === 'process'}⚙{:else if kind === 'org'}▦{:else if kind === 'suggestion'}𝚫{:else if kind === 'team'}𑗕{/if}</span
	>
	<slot /></a
>

<style>
	a {
		color: currentColor;
		transition: transform 200ms;
		display: inline-block;
		border-radius: var(--padding);
		line-height: 1.2;
		text-decoration: underline;
		text-decoration-color: var(--salient);
		text-decoration-thickness: var(--thickness);
	}

	a.inactive {
		color: var(--inactive);
		text-decoration: none;
		background: none;
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
		text-shadow: 1px 1px black;
	}

	.person {
		background-color: none;
		color: var(--salient);
		font-weight: bold;
		padding-inline-start: 0;
		padding-inline-end: 0;
		text-shadow: none;
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
	.suggestion {
		background-color: var(--salient);
	}

	.team {
		background-color: var(--foreground);
	}

	.emoji {
		font-size: 100%;
	}
</style>
