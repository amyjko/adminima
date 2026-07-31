import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Organization, {
	type OrganizationRow,
	type RealtimeStatus
} from '../src/database/Organization';
import type Database from '../src/database/Database';
import { ANON_KEY, admin, cleanup, createTestOrg, readRow, type TestOrg } from './harness';

/**
 * Exercises the realtime connection's state machine against the running stack.
 *
 * A lost connection used to be a dead end: the failure was reported once and nothing ever cleared
 * it, normal teardown reported a failure that hadn't happened, and an errored channel could not be
 * revived. These tests cover all three, using a client pointed at a dead port to produce a real
 * failure rather than a simulated one.
 */

let org: TestOrg;
let row: OrganizationRow;

/** A client whose realtime socket can never connect, for producing genuine subscription failures. */
let broken: SupabaseClient<Database>;

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Wait for something to become true, checking often, so tests finish as soon as it does. */
async function waitFor(condition: () => boolean, timeout: number, what: string) {
	const start = Date.now();
	while (!condition()) {
		if (Date.now() - start > timeout)
			throw new Error(`Timed out after ${timeout}ms waiting: ${what}`);
		await delay(50);
	}
}

/**
 * Change the organization until a live update arrives.
 *
 * The server reports SUBSCRIBED before it has finished wiring up replication, so a single change
 * made the moment a channel connects can be missed. Repeating one avoids a flaky test without
 * papering over a real failure: if updates aren't being delivered at all, this still times out.
 */
async function changeUntilNotified(notifications: () => number, timeout: number) {
	const start = Date.now();
	const before = notifications();
	while (notifications() === before) {
		if (Date.now() - start > timeout) throw new Error(`No live update within ${timeout}ms`);
		await admin
			.from('orgs')
			.update({ name: `Renamed ${Date.now()}` })
			.eq('id', org.id);
		await delay(500);
	}
}

beforeAll(async () => {
	org = await createTestOrg('Realtime');
	row = (await readRow('orgs', org.id))!;
	broken = createClient<Database>('http://127.0.0.1:54399', ANON_KEY, {
		auth: { autoRefreshToken: false, persistSession: false },
		// Fail fast: the app waits ten seconds for a channel to join, which would make this slow.
		realtime: { timeout: 2000 }
	});
});

afterAll(async () => {
	broken.realtime.disconnect();
	org.admin.client.realtime.disconnect();
	await cleanup();
});

describe('realtime connection', () => {
	it('delivers live updates and stays quiet through teardown', async () => {
		const statuses: RealtimeStatus[] = [];
		let notified = 0;
		const listener = () => notified++;

		org.admin.db.listen(row, listener, (status) => statuses.push(status));
		await waitFor(() => statuses.includes('connected'), 15000, 'the subscription to connect');

		await changeUntilNotified(() => notified, 15000);

		// Unsubscribing closes the channel, which must not be mistaken for a failure — that is what
		// used to put "Lost live updates" on screen after simply leaving an organization's page.
		org.admin.db.ignore(org.id, listener);
		await delay(1000);

		expect(statuses).not.toContain('disconnected');
		expect(statuses.filter((s) => s === 'connected')).toHaveLength(1);
	});

	it('retries a lost connection, gives up, and recovers on demand', async () => {
		// The app's schedule takes about ninety seconds to exhaust; this runs the same path quickly.
		const db = new Organization(broken, { attempts: 2, delay: 200, maxDelay: 200 });
		const statuses: RealtimeStatus[] = [];
		let notified = 0;
		const listener = () => notified++;

		db.listen(row, listener, (status) => statuses.push(status));

		await waitFor(() => statuses.at(-1) === 'disconnected', 30000, 'the retries to be exhausted');

		// It retried rather than giving up on the first failure, and never claimed to be connected.
		expect(statuses.filter((s) => s === 'connecting').length).toBeGreaterThan(1);
		expect(statuses).not.toContain('connected');

		// Now let it reach a working stack, as returning to a backgrounded tab does.
		db.setSupabaseClient(org.admin.client);
		db.reconnect(org.id, { reset: true });

		await waitFor(() => statuses.at(-1) === 'connected', 15000, 'the reconnection to succeed');

		// Reconnecting refreshes, since changes may have landed during the gap.
		expect(notified).toBeGreaterThan(0);

		db.ignore(org.id, listener);
	}, 60000);
});
