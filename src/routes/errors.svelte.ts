import type { PostgrestError } from '@supabase/supabase-js';

export type DBError = { message: string; error: PostgrestError | undefined };
export let errors = $state<DBError[]>([]);

export function addError(message: string, error?: PostgrestError) {
	errors.push({ message, error });
}

export async function queryOrError(query: Promise<PostgrestError | null>, message: string) {
	const error = await query;
	if (error) {
		addError(message, error);
		return error;
	}
	return null;
}
