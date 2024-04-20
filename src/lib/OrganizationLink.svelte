<script lang="ts">
	import Link from './Link.svelte';
	import type Org from '$types/Org';

	export let org: Org;
</script>

<Link to="/organization/{org.getID()}">{org.getName()}</Link>
