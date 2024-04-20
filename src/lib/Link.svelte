<script lang="ts">
	import { page } from '$app/stores';

	export let to: string;
	export let external = false;
	export let bland = false;
	export let kind: 'person' | 'role' | 'process' | 'org' | 'team' | 'change' | null = null;

	$: inactive = to === $page.url.pathname;
</script>

<a
	class={kind}
	class:inactive
	class:bland
	class:kinded={kind !== null}
	href={inactive ? null : to}
	target={external ? '_blank' : ''}
	><span class="emoji"
		>{#if kind === 'person'}👤{:else if kind === 'role'}🔨{:else if kind === 'process'}⚙️{:else if kind === 'org'}🏠{:else if kind === 'change'}✍️{/if}</span
	>
	<slot /></a
>{#if external}<sup class="external">↗</sup>{/if}

<style>
	a {
		color: var(--foreground);
		padding-left: var(--padding);
		padding-right: var(--padding);
		text-decoration: none;
		transition: transform 200ms;
		display: inline-block;
		border-radius: var(--padding);
		line-height: 1.2;
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
		text-decoration: underline;
		text-decoration-thickness: var(--thickness);
		text-decoration-skip-ink: none;
		transform-origin: center;
		transform: scaleY(1.1);
	}

	a:focus {
		outline: var(--thickness) solid var(--focus);
	}

	.external {
		font-size: small;
	}

	.kinded {
		color: var(--background);
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

	.emoji {
		font-size: 80%;
	}
</style>
