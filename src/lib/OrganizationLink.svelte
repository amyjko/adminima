<script lang="ts">
	import Link from './Link.svelte';

	interface Props {
		id: string;
		name: string;
	}

	let { id, name }: Props = $props();
</script>

<Link to="/org/{id}" kind="org">{name}</Link>
