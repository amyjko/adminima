import Organizations from '$database/Organizations';

export async function load({ params }) {
	const orgs = await Organizations.getPersonsOrganizations(params.personid);
	return {
		orgs
	};
}
