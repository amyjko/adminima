import type { PostgrestError } from '@supabase/supabase-js';

export type DBError = { message: string; error: PostgrestError | undefined };
export let errors = $state<DBError[]>([]);
