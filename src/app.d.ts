// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{ user: User | null }>;
			session: Session | null;
			user: User | null;
		}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
