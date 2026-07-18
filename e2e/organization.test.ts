import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Organization from '../src/database/Organization';
import {
	admin,
	anonClient,
	cleanup,
	createTestOrg,
	expectNoError,
	expectOk,
	readRow,
	type TestOrg
} from './harness';

let org: TestOrg;

beforeAll(async () => {
	org = await createTestOrg('Org CRUD');
});

afterAll(cleanup);

describe('organization CRUD', () => {
	it('createOrganization created the org with the creator as admin', async () => {
		const row = await readRow('orgs', org.id);
		expect(row?.name).toBe('Org CRUD');

		const { data: profile } = await admin
			.from('profiles')
			.select('*')
			.eq('id', org.admin.profileid)
			.single();
		expect(profile?.admin).toBe(true);
	});

	it('updateOrgName updates the name', async () => {
		const row = await readRow('orgs', org.id);
		expectOk(await org.admin.db.updateOrgName(row!, 'Renamed Org', org.admin.id), 'updateOrgName');
		expect((await readRow('orgs', org.id))?.name).toBe('Renamed Org');
	});

	it('updateOrgDescription updates the description', async () => {
		const row = await readRow('orgs', org.id);
		expectOk(
			await org.admin.db.updateOrgDescription(row!, 'A description', org.admin.id),
			'updateOrgDescription'
		);
		expect((await readRow('orgs', org.id))?.description).toBe('A description');
	});

	it('updateOrgPrompt updates the prompt', async () => {
		const row = await readRow('orgs', org.id);
		expectOk(
			await org.admin.db.updateOrgPrompt(row!, 'What changed?', org.admin.id),
			'updateOrgPrompt'
		);
		expect((await readRow('orgs', org.id))?.prompt).toBe('What changed?');
	});

	it('updateOrgVisibility updates visibility', async () => {
		const row = await readRow('orgs', org.id);
		expectOk(
			await org.admin.db.updateOrgVisibility(row!, 'public', org.admin.id),
			'updateOrgVisibility'
		);
		expect((await readRow('orgs', org.id))?.visibility).toBe('public');
	});

	it('addOrgPath adds a path and pathIsAvailable reflects it', async () => {
		const path = `e2e-path-${Date.now()}`;
		expect(await org.admin.db.pathIsAvailable(path)).toBe(true);

		const row = await readRow('orgs', org.id);
		expectOk(await org.admin.db.addOrgPath(row!, path), 'addOrgPath');

		expect((await readRow('orgs', org.id))?.paths).toContain(path);
		expect(await org.admin.db.pathIsAvailable(path)).toBe(false);
	});

	it('getPath returns the newest path, or the id when there is none', async () => {
		const row = await readRow('orgs', org.id);
		expect(Organization.getPath(row!)).toBe(row!.paths[row!.paths.length - 1]);
	});

	it('getPersonsOrganizations lists orgs the person belongs to', async () => {
		const { data, error } = await org.admin.db.getPersonsOrganizations(org.admin.id);
		expect(error).toBeNull();
		expect(data?.map((o) => o.id)).toContain(org.id);
	});

	it('getPersonsOrganizations does not list orgs the person is not in', async () => {
		const { data } = await org.outsider.db.getPersonsOrganizations(org.outsider.id);
		expect(data?.map((o) => o.id) ?? []).not.toContain(org.id);
	});

	it('getUser returns the signed in person', async () => {
		const { data } = await org.admin.db.getUser();
		expect(data.user?.id).toBe(org.admin.id);
	});
});

describe('organization access control', () => {
	it('a non-admin member cannot rename the org', async () => {
		const before = await readRow('orgs', org.id);
		await org.member.db.updateOrgName(before!, 'Member Renamed', org.member.id);
		expect((await readRow('orgs', org.id))?.name).toBe(before!.name);
	});

	it('an outsider cannot rename the org', async () => {
		const before = await readRow('orgs', org.id);
		await org.outsider.db.updateOrgName(before!, 'Outsider Renamed', org.outsider.id);
		expect((await readRow('orgs', org.id))?.name).toBe(before!.name);
	});

	it('an anonymous caller cannot rename the org', async () => {
		const before = await readRow('orgs', org.id);
		const anonDb = new Organization(anonClient());
		await anonDb.updateOrgName(before!, 'Anon Renamed', org.admin.id);
		expect((await readRow('orgs', org.id))?.name).toBe(before!.name);
	});
});
