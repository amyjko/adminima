<script lang="ts">
	import Button from './Button.svelte';
	import Dialog from './Dialog.svelte';
	import Form from './Form.svelte';
	import Header from './Header.svelte';
	import Paragraph from './Paragraph.svelte';
	import Actions from './Actions.svelte';
	import Loading from './Loading.svelte';

	interface Props {
		button: string;
		showTip: string;
		submitTip: string;
		submit: string;
		header: string;
		explanation: string;
		action: () => Promise<boolean>;
		valid: () => boolean;
		inactive: string;
		children?: import('svelte').Snippet;
	}

	let {
		button,
		showTip,
		submitTip,
		submit,
		header,
		explanation,
		action,
		valid,
		inactive,
		children
	}: Props = $props();

	let show = $state(false);
	let submitting = $state(false);

	let active = $derived(!submitting && valid());

	async function doAction() {
		if (!active) {
			return;
		}
		submitting = true;
		const result = await action();
		submitting = false;
		if (result) show = false;
	}
</script>

<Button tip={showTip} action={() => (show = true)}>{button}</Button>
{#if show}
	<Dialog close={() => (show = false)}>
		<Header>{header}</Header>
		<Paragraph>{explanation}</Paragraph>
		<Form {active} inactiveMessage={inactive} action={doAction}>
			{@render children?.()}
			<Actions
				><Button tip="Dismiss this dialog." end action={() => (show = false)}>Cancel</Button><Button
					tip={submitTip}
					end
					submit
					{active}
					action={doAction}>{submit}</Button
				>
			</Actions>
			{#if submitting}<Loading />{/if}
		</Form>
	</Dialog>
{/if}
