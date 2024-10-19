<script lang="ts">
	import Paragraph from '$lib/Paragraph.svelte';
	import Lead from '$lib/Lead.svelte';
	import Title from '$lib/Title.svelte';
	import Link from '$lib/Link.svelte';
	import OrganizationLink from '$lib/OrganizationLink.svelte';
	import Notice from '$lib/Notice.svelte';
	import Flow from '$lib/Flow.svelte';
	import Tip from '$lib/Tip.svelte';

	interface Props {
		data: any;
	}

	let { data }: Props = $props();
</script>

<Title title="Adminima" />
<Lead
	>Improve your organization's onboarding, transparency, and agility by defining work processes and
	managing requests for change.</Lead
>
<Paragraph
	>Create step-by-step processes to scaffold work processes. Manage requests for change. Define who
	is accountable and responsible.</Paragraph
>

<Tip>
	Want to create an organization? Ask <Link to="mailto:ajko@uw.edu">Amy</Link> for an invite code, then
	<Link to="/login">log in</Link>. Or, browse some public organizations to explore the platform.
</Tip>

{#if data.orgs}
	<Flow>
		{#each data.orgs as org}
			<OrganizationLink id={org.id} name={org.name} />
		{:else}
			<Notice>No public organizations yet.</Notice>
		{/each}
	</Flow>
{/if}
