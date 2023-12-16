<script lang="ts">
	export let name: string;
</script>

<div class="row">
	<div class="name">{name}</div>
	<div class="content"><slot /></div>
</div>

<style>
	.row {
		width: 100%;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
	}

	.name {
		color: var(--inactive);
		width: 30%;
		min-width: 8em;
		text-transform: lowercase;
		font-style: italic;
	}

	.content {
		flex-grow: 1;
	}
</style>
