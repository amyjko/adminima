<script lang="ts">
	import Changes from '$lib/Changes.svelte';
	import { getOrg } from '$routes/+layout.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import Link from '$lib/Link.svelte';
	import Tip from '$lib/Tip.svelte';

	const context = getOrg();
	let organization = $derived(context?.org);
</script>

<Title title="Changes" kind="change" label={false} />

<Link to="/org/{organization.getPath()}/changes/new">Suggest a change…</Link>

<Tip>These are changes people have proposed to make to this organization.</Tip>
<Changes changes={organization.getChanges()}
	><Paragraph>There are no changes suggested for this organization.</Paragraph></Changes
>
