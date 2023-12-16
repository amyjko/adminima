import MockActivities from '$lib/mock/activities.json?raw';
import MockRole from '$lib/mock/role.json?raw';
import type Activity from '../types/Activity';
import type { RoleID } from '../types/Role';
import type Role from '../types/Role';

/** Represents an interface to a database, and CRUD operations for modifying the database. */
class Database {
	constructor() {}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async getRole(id: RoleID): Promise<Role> {
		return JSON.parse(MockRole) as Role;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async getRoleActivities(id: RoleID) {
		return JSON.parse(MockActivities) as Activity[];
	}
}

const database = new Database();

export default database;
