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

	static async createRole(
		who: PersonID,
		organization: OrganizationID,
		title: string
	): Promise<Role> {
		const newRole: Role = {
			id: uuidv4(),
			organization,
			title,
			what: '',
			people: [],
			revisions: [
				{
					when: Date.now(),
					person: who,
					what: 'Created role',
					why: '',
					change: null
				}
			],
			status: null,
			visibility: 'public'
		};

		// TODO Update database with new role.

		return newRole;
	}

	static async deleteRole(id: RoleID) {
		// TODO Delete process from database
	}

	/** Cache the organization here for later access, updating the store for reactive output */
	static async updateOrganization(organization: Organization) {
		// TODO Update database with new organization.
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
