import type { PlaywrightTestConfig } from '@playwright/test';

/**
 * Two servers, because the two kinds of test need different things.
 *
 * The application is checked against a production build, which is the only way to catch what only
 * breaks once it is built. The editor is checked against the dev server, which serves the source
 * modules, so that the editor can be mounted on a bare element and driven directly rather than
 * reached through a signed in page.
 */
const config: PlaywrightTestConfig = {
	webServer: [
		{
			// CI builds in a step of its own before this runs, so building again here would only
			// repeat it. That makes the build a prerequisite of running these in CI.
			command: process.env.CI ? 'npm run preview' : 'npm run build && npm run preview',
			port: 4173,
			reuseExistingServer: !process.env.CI,
			// The default minute is enough locally but not always on a runner, where the build or
			// vite's first dependency scan has nothing warm to work from.
			timeout: 120000
		},
		{
			command: 'npm run dev -- --port 5173 --strictPort',
			port: 5173,
			reuseExistingServer: !process.env.CI,
			timeout: 120000
		}
	],
	testDir: 'tests',
	projects: [
		{
			name: 'app',
			testMatch: 'test.ts',
			use: { baseURL: 'http://localhost:4173' }
		},
		{
			name: 'editor',
			testMatch: 'editor.test.ts',
			use: { baseURL: 'http://localhost:5173' }
		}
	]
};

export default config;
