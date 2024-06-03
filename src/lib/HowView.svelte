<script lang="ts">
	import type { HowRow, ProcessRow } from '$database/Organizations';
	import Organizations from '$database/Organizations';
	import RoleLink from './RoleLink.svelte';
	import Visibility from './Visibility.svelte';
	import { getOrg } from './contexts';

	export let how: HowRow;
	export let process: ProcessRow;

	const org = getOrg();

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

	async function insertHow() {
		// See if this how has a parent, and if so, insert after this how.
		const parent = $org.getHowParent(how.id);
		let howID: string | undefined = undefined;
		if (parent) {
			const { id } = await Organizations.insertHow(process, parent, parent.how.indexOf(how.id) + 1);
			if (id) {
				howID = id;
			}
		}
		// Otherwise, insert at the first position of this how.
		else {
			const { id } = await Organizations.insertHow(process, how, 0);
			if (id) howID = id;
		}

		if (howID) document.getElementById(`how-${howID}`)?.focus();
	}

	function deleteHow() {
		const parent = $org.getHowParent(how.id);
		if (process.howid !== how.id && parent) {
			Organizations.deleteHow(parent, how);

			const focusID =
				parent.how.length === 1 || parent.how[0] === how.id
					? parent.id
					: parent.how[parent.how.indexOf(how.id) - 1];
			document.getElementById(`how-${focusID}`)?.focus();
		}
	}
</script>

<div class="how">
	<div class="main">
		<div
			role="checkbox"
			class="complete"
			aria-checked={how.done === 'no' ? 'false' : how.done === 'pending' ? 'mixed' : 'true'}
			tabindex="0"
			on:keydown={(event) =>
				event.key === 'Enter' || event.key === ' ' ? toggleDone() : undefined}
			on:pointerdown={toggleDone}
		>
			{#if how.done === 'no'}&nbsp;{:else if how.done === 'pending'}…{:else}✔{/if}
		</div>
		<textarea
			rows={text.split('\n').length}
			class:done={how.done === 'yes'}
			class:pending={how.done === 'pending'}
			id="how-{how.id}"
			bind:value={text}
			bind:this={input}
			on:blur={save}
			on:keydown={(e) => {
				if (e.key === 'Enter' && e.metaKey) {
					e.preventDefault();
					insertHow();
				} else if (e.key === 'Backspace' && text === '') {
					deleteHow();
				}
			}}
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
	<ol>
		{#each how.how
			.map((h) => $org.getHow(h))
			.filter((h) => h !== undefined) as subhow, index (subhow ? subhow.id : index)}
			<li><svelte:self how={subhow} {process} /></li>
		{/each}
	</ol>
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

	textarea.pending {
		font-style: italic;
		background: var(--chrome);
		border-radius: var(--radius);
	}
</style>
