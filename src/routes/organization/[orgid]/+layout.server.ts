import data from '$database/mock.json';
import type Change from '$types/Change';
import type Organization from '$types/Organization';
import type Person from '$types/Person';
import type Process from '$types/Process';
import type Role from '$types/Role';

type MockData = {
	roles: Role[];
	organizations: Organization[];
	people: Person[];
	changes: Change[];
	processes: Process[];
};

const mock = data as unknown as MockData;

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params }) {
	const orgid = params.orgid;

	const org = mock.organizations.find((org) => org.id === orgid);

	if (org) {
		return {
			payload: org
				? {
						organization: org,
						roles: mock.roles.filter((role) => role.organization === orgid),
						people: mock.people.filter((person) => org.staff.includes(person.id)),
						processes: mock.processes.filter((task) => task.organization === orgid),
						changes: mock.changes.filter((change) => change.organization === orgid)
				  }
				: null
		};
	}
}
