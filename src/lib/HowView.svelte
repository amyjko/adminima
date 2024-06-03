<script lang="ts">
	import type { HowRow } from '$database/Organizations';
	import Organizations from '$database/Organizations';
	import Choice from './Choice.svelte';
	import RoleLink from './RoleLink.svelte';
	import Visibility from './Visibility.svelte';

	export let how: HowRow;

	let input: HTMLTextAreaElement;

	let text = how.what;

	function save() {
		Organizations.updateHowText(how, text);
	}

	function toggleDone() {
		Organizations.updateHowDone(
			how,
			how.done === 'no' ? 'pending' : how.done === 'pending' ? 'yes' : 'no'
		);
	}
</script>

<div class="how">
	<div class="main">
		<div
			role="checkbox"
			class="complete"
			aria-checked={how.done === 'no' ? 'false' : how.done === 'pending' ? 'mixed' : 'true'}
			tabindex="0"
			on:keydown={toggleDone}
			on:pointerdown={toggleDone}
		>
			{#if how.done === 'no'}&nbsp;{:else if how.done === 'pending'}…{:else}✔{/if}
		</div>
		<textarea
			rows={text.split('\n').length}
			class:done={how.done === 'yes'}
			bind:value={text}
			bind:this={input}
			on:blur={save}
		/>
	</div>
	<div class="meta">
		<Visibility
			level={how.visibility}
			edit={(vis) =>
				vis === 'public' || vis === 'org' || vis === 'admin'
					? Organizations.updateHowVisibility(how, vis)
					: undefined}
		/>
		<span>
			{#if how.accountable}<RoleLink roleID={how.accountable} />{/if}</span
		>
	</div>
	<ul>
		{#each how.how as subhow}
			<li><svelte:self how={subhow} /></li>
		{/each}
	</ul>
</div>

<style>
	.how {
		display: flex;
		flex-direction: column;
		gap: var(--padding);
	}

	.main,
	.meta {
		display: flex;
		flex-direction: row;
		gap: var(--padding);
		align-items: baseline;
	}

	.complete {
		width: 1em;
		height: 1em;
		background: var(--chrome);
		padding: var(--padding);
		border-radius: 50%;
		font-size: var(--font-size);
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-around;
		cursor: pointer;
		user-select: none;
	}

	.complete:focus {
		outline: var(--focus) solid var(--thickness);
	}

	textarea {
		flex: 1;
		font-family: inherit;
		font-size: inherit;
		line-height: inherit;
		border: none;
		padding: var(--padding);
		min-height: calc(1em);
		resize: none;
	}

	textarea:focus {
		outline: var(--focus) solid var(--thickness);
		border-color: transparent;
	}

	textarea.done {
		text-decoration: line-through;
	}
</style>
