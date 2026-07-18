import { defineConfig } from 'vitest/config';

/**
 * End-to-end tests against a running local Supabase stack (`npx supabase start`).
 * Kept separate from the unit test project so `npm run test:unit` stays runnable without Docker.
 */
export default defineConfig({
	test: {
		include: ['e2e/**/*.test.ts'],
		// These tests share one database; running files in parallel would let cleanup in one file
		// delete rows another is still using.
		fileParallelism: false,
		testTimeout: 30000,
		hookTimeout: 60000
	}
});
