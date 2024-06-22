<script lang="ts">
	import Button from './Button.svelte';
	import Dialog from './Dialog.svelte';
	import Form from './Form.svelte';
	import Header from './Header.svelte';
	import Paragraph from './Paragraph.svelte';
	import Actions from './Actions.svelte';
	import Oops from './Oops.svelte';

	export let button: string;
	export let showTip: string;
	export let submitTip: string;
	export let submit: string;
	export let header: string;
	export let error: string | undefined;
	export let explanation: string;
	export let action: () => void;
	export let valid: () => boolean;

	let show = false;
</script>

<Button tip={showTip} action={() => (show = true)}>{button}</Button>
{#if show}
	<Dialog close={() => (show = false)}>
		<Header>{header}</Header>
		<Paragraph>{explanation}</Paragraph>
		<Form
			action={() => {
				action();
				show = false;
			}}
		>
			<slot />
			<Actions
				><Button tip="Dismiss this dialog." end action={() => (show = false)}>cancel</Button><Button
					tip={submitTip}
					end
					submit
					active={valid()}
					action={() => {}}>{submit}</Button
				>
			</Actions>
			{#if error}
				<Oops text={error} />
			{/if}
		</Form>
	</Dialog>
{/if}
