<script lang="ts">
</script>

<div class="tip">
	<div>💡</div>
	<div><slot /></div>
</div>

<style>
	.tip {
		display: flex;
		width: 100%;
		flex-direction: row;
		gap: var(--padding);
		font-style: italic;
		padding: var(--padding);
		border-top: 1px var(--border) solid;
		border-bottom: 1px var(--border) solid;
	}
</style>
