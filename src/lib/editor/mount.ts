/**
 * Mounting editor components inside a browser test.
 *
 * Nothing in the application imports this. It exists so that a Playwright test can reach a real
 * component through the dev server and check the attributes it actually renders, rather than
 * checking the state that feeds it and trusting the rest to follow. Vite rewrites the imports
 * here, which is what makes `svelte` and a `.svelte` file resolvable from inside a page.
 *
 * It lives under src/ only because that is what the dev server serves. Nothing imports it, so it
 * is never part of a build.
 */
import { mount, type ComponentProps } from 'svelte';
import MarkupToolbar from '../MarkupToolbar.svelte';

type ToolbarProps = ComponentProps<typeof MarkupToolbar>;

export function mountToolbar(target: HTMLElement, props: ToolbarProps) {
	return mount(MarkupToolbar, { target, props });
}
