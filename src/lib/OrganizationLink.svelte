<script lang="ts">
	import Link from './Link.svelte';
	import { type OrganizationID } from '$types/Organization';

	export let id: OrganizationID;
	export let name: string;
</script>

<Link to="/org/{id}" kind="org">{name}</Link>
