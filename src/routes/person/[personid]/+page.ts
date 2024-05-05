import Database from '$database/Database';

export async function load({ params }) {
	const orgs = await Database.getPersonsOrganizations(params.personid);
	return {
		orgs
	};
}
