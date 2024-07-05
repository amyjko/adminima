<script lang="ts">
	import { getOrg, getUser } from './contexts';

	export let admin = false;
	export let member = false;

	const user = getUser();
	const org = getOrg();

	$: isMember = $user && $org?.hasPerson($user.id);
	$: isAdmin = $user && $org?.hasAdminPerson($user.id);
</script>

{#if (admin === false && member === false) || (admin && isAdmin) || (member && isMember)}
	<div class="tip">
		<div>💡</div>
		<div><slot /></div>
	</div>
{/if}

<style>
	.tip {
		display: flex;
		width: 100%;
		flex-direction: row;
		gap: var(--padding);
		font-style: italic;
		padding: var(--padding);
		font-size: var(--small-size);
		border-left: var(--thickness) var(--border) solid;
	}
</style>
