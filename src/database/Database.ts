import type { ProcessID } from '../types/Process';
import type { PersonID } from '../types/Person';
import type Person from '../types/Person';
import type { RoleID } from '../types/Role';
import type Role from '../types/Role';
import type { OrganizationID } from '../types/Organization';
import type Organization from '../types/Organization';
import type Change from '../types/Change';
import type { ChangeID } from '../types/Change';
import { v4 as uuidv4 } from 'uuid';
import type Markup from '../types/Markup';
import ReactiveMap from './ReactiveMap';
import type Process from '../types/Process';
import Org from '$types/Org';
import { supabase } from '$lib/supabaseClient';
import type { PostgrestError } from '@supabase/supabase-js';

export type OrgPayload = {
	organization: Organization;
	roles: Role[];
	people: Person[];
	processes: Process[];
	changes: Change[];
};

/** A front end interface to the backing store, caching data loaded from the database and offering operations for modifying the database. */
class Database {
	static readonly organizations = new ReactiveMap<OrganizationID, Org>();

	static updateOrg(org: OrgPayload) {
		return Database.organizations.set(org.organization.id, new Org(org));
	}

	static async refresh(orgid: OrganizationID) {
		const payload = await Database.getOrgPayload(orgid);
		if (payload) Database.updateOrg(payload);
	}

	static async createRole(orgid: OrganizationID, title: string): Promise<RoleID | null> {
		const { data } = await supabase
			.from('roles')
			.insert({
				orgid: orgid,
				title,
				description: ''
			})
			.select()
			.single();

		await Database.refresh(orgid);

		return data?.id ?? null;
	}

	static async deleteRole(orgid: OrganizationID, id: RoleID): Promise<PostgrestError | null> {
		const { error } = await supabase.from('roles').delete().eq('id', id);
		if (error) return error;
		else {
			Database.refresh(orgid);
			return null;
		}
	}

	/** Cache the organization here for later access, updating the store for reactive output */
	static async updateOrganization(organization: Organization) {
		// TODO Update database with new organization.
	}

	static async updateOrganizationName(
		orgid: OrganizationID,
		name: string
	): Promise<PostgrestError | null> {
		const { error } = await supabase.from('orgs').update({ name: name }).eq('id', orgid);
		if (error) return error;
		else {
			await Database.refresh(orgid);
			return null;
		}
	}

	static async getOrgPayload(orgid: string): Promise<OrgPayload | null> {
		const organization = await Database.getOrganization(orgid);
		const people = await Database.getOrganizationsPeople(orgid);
		const roles = await Database.getOrganizationsRoles(orgid);

		return organization === null || people === null || roles === null
			? null
			: {
					organization,
					people,
					roles,
					// TODO Update when processes are defined
					processes: [],
					changes: []
			  };
	}

	static async getOrganization(orgid: OrganizationID): Promise<Organization | null> {
		const { data } = await supabase.from('orgs').select().eq('id', orgid).single();
		if (data === null) return null;
		const people = await Database.getOrganizationsPeople(orgid);
		if (people === null) return null;
		return {
			...data,
			admins: people.filter((p) => p.admin).map((p) => p.id),
			staff: people.map((p) => p.id),
			teams: [],
			concerns: [],
			statuses: [],
			visibility: 'public',
			revisions: []
		};
	}

	static async getPersonsOrganizations(
		personid: PersonID
	): Promise<{ id: string; name: string }[] | null> {
		const { data } = await supabase
			.from('orgs')
			.select(`id, name, profiles!profiles_orgid_fkey(personid)`)
			.not('profiles', 'is', null)
			.eq('profiles.personid', personid);
		return data ?? [];
	}

	static async getOrganizationsPeople(orgid: OrganizationID): Promise<Person[] | null> {
		const { data } = await supabase
			.from('profiles')
			.select(`personid, orgid, name, bio, admin, supervisor, people!profiles_personid_fkey(email)`)
			.eq('orgid', orgid);
		return data
			? data.map((person) => ({
					id: person.personid,
					organization: person.orgid,
					name: person.name,
					bio: person.bio,
					email: person.people ? person.people.email : '',
					supervisor: person.supervisor,
					admin: person.admin
			  }))
			: null;
	}

	static async getOrganizationsRoles(orgid: OrganizationID): Promise<Role[] | null> {
		const { data } = await supabase.from('roles').select(`*`).eq('orgid', orgid);
		return data
			? data.map((role) => {
					return {
						...role,
						people: [],
						team: null,
						status: null,
						visibility: 'public',
						revisions: [],
						organization: orgid
					};
			  })
			: null;
	}

	static async deleteProcess(id: ProcessID) {
		// TODO Delete process from database.
		// Database.processes.delete(id);
	}

	static async createChange(
		who: PersonID,
		organization: OrganizationID,
		title: string,
		problem: Markup,
		processes: ProcessID[],
		roles: RoleID[]
	): Promise<Change> {
		const newRequest: Change = {
			id: uuidv4(),
			who,
			title,
			problem,
			watchers: [],
			organization,
			roles,
			processes: processes,
			comments: [],
			status: 'triage',
			revisions: [
				{
					when: Date.now(),
					person: who,
					what: 'Created request',
					why: '',
					change: null
				}
			]
		};

		// TODO Update change in database
		// Database.changes.set(newRequest.id, newRequest);

		return newRequest;
	}

	static async deleteChange(id: ChangeID) {
		// TODO Delete change in database
		// Database.changes.delete(id);
	}
}

export default Database;
