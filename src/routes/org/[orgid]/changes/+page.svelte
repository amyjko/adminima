<script lang="ts">
	import Changes from '$lib/Changes.svelte';
	import { getOrg } from '$routes/org/[orgid]/+layout.svelte';
	import Paragraph from '$lib/Paragraph.svelte';
	import Title from '$lib/Title.svelte';
	import Link from '$lib/Link.svelte';
	import Tip from '$lib/Tip.svelte';
	import Organization from '$database/Organization';

	const { data } = $props();

	const context = getOrg();
</script>

<Title title="Changes" kind="change" label={false} />

<Link to="/org/{Organization.getPath(context().org)}/changes/new">Suggest a change…</Link>

<Tip>These are changes people have proposed to make to this organization.</Tip>
<Changes changes={data.changes} profiles={data.profiles}
	><Paragraph>There are no changes suggested for this organization.</Paragraph></Changes
>
