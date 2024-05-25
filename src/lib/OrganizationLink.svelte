<script lang="ts">
	import Link from './Link.svelte';
	import type Organization from '$types/Organization';

	export let org: Organization;
</script>

<Link to="/organization/{org.getID()}" kind="org">{org.getName()}</Link>
