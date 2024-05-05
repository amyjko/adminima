import Database from '$database/Database';
// import data from '$database/mock.json';
// import type Change from '$types/Change';
// import type Organization from '$types/Organization';
// import type Person from '$types/Person';
// import type Process from '$types/Process';
// import type Role from '$types/Role';

// type MockData = {
// 	roles: Role[];
// 	organizations: Organization[];
// 	people: Person[];
// 	changes: Change[];
// 	processes: Process[];
// };

// const mock = data as unknown as MockData;

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params }) {
	const org = await Database.getOrgPayload(parseInt(params.orgid));

	// const org = mock.organizations.find((org) => org.id === orgid);

	return {
		payload: org
	};
}
