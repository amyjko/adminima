<script lang="ts">
	interface Props {
		text: string | undefined;
	}

	let { text }: Props = $props();
</script>

<span class="localized">{text ?? '...'}</span>
