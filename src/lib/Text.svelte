<script lang="ts">
	export let text: string | undefined;
</script>

<span class="localized">{text ?? '...'}</span>
