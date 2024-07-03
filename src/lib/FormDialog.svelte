<script lang="ts">
	import Button from './Button.svelte';
	import Dialog from './Dialog.svelte';
	import Form from './Form.svelte';
	import Header from './Header.svelte';
	import Paragraph from './Paragraph.svelte';
	import Actions from './Actions.svelte';
	import Loading from './Loading.svelte';

	export let button: string;
	export let showTip: string;
	export let submitTip: string;
	export let submit: string;
	export let header: string;
	export let explanation: string;
	export let action: () => Promise<boolean>;
	export let valid: () => boolean;
	export let inactive: string;

	let show = false;
	let submitting = false;

	$: active = !submitting && valid();
</script>

<Button tip={showTip} action={() => (show = true)}>{button}</Button>
{#if show}
	<Dialog close={() => (show = false)}>
		<Header>{header}</Header>
		<Paragraph>{explanation}</Paragraph>
		<Form
			{active}
			{inactive}
			action={async () => {
				if (!active) {
					return;
				}
				submitting = true;
				const result = await action();
				submitting = false;
				if (result) show = false;
			}}
		>
			<slot />
			<Actions
				><Button tip="Dismiss this dialog." end action={() => (show = false)}>Cancel</Button><Button
					tip={submitTip}
					end
					submit
					{active}
					action={() => {}}>{submit}</Button
				>
			</Actions>
			{#if submitting}<Loading />{/if}
		</Form>
	</Dialog>
{/if}
