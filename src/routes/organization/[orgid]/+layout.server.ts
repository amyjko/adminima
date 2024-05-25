import Organizations from '$database/Organizations';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params }) {
	/** Get the serializable organization payload from the database */
	const org = await Organizations.getPayload(params.orgid);

	return {
		payload: org
	};
}
