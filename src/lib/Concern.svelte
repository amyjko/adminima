<script lang="ts">
	export let concern: string;
</script>

<span class="concern" title={concern}
	>{#if concern.length === 0}<em>no concern</em>{:else}{concern}{/if}</span
>

<style>
	.concern {
		text-transform: none;
		display: inline-block;
		align-self: flex-start;
		font-size: var(--small-size);
		padding-left: var(--padding);
		padding-right: var(--padding);
		background: var(--salient);
		color: var(--background);
	}
</style>
