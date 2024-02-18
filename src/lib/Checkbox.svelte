<script lang="ts">
	export let on: boolean;
	export let enabled: boolean = true;
	export let change: (on: boolean) => void;
</script>

<input type="checkbox" disabled={!enabled} bind:checked={on} on:change={() => change(on)} />
