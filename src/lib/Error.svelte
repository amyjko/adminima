<script lang="ts">
	import type { PostgrestError } from '@supabase/supabase-js';
	import Oops from './Oops.svelte';

	export let error: PostgrestError;
	export let inline: boolean = true;
</script>

<Oops text={error.message} {inline} />
