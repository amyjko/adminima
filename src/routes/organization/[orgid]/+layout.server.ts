import data from '$database/Mock.js';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params }) {
	const orgid = params.orgid;

	const org = data.organizations.find((org) => org.id === orgid);

	if (org) {
		return {
			payload: org
				? {
						organization: org,
						roles: data.roles.filter((role) => role.organization === orgid),
						people: data.people.filter((person) => org.staff.includes(person.id)),
						processes: data.processes.filter((task) => task.organization === orgid),
						changes: data.changes.filter((change) => change.organization === orgid)
				  }
				: null
		};
	}
}
