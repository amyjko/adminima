import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			preprocess: vitePreprocess(),
			adapter: adapter(),
			version: {
				pollInterval: 600000
			}
		})
	],
	test: {
		include: ['{src,restore}/**/*.{test,spec}.{js,ts}']
	}
});
