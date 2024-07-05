<script lang="ts">
	import Link from './Link.svelte';

	export let id: string;
	export let name: string;
</script>

<Link to="/org/{id}" kind="org">{name}</Link>
