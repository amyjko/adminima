export type PersonID = string;

type Person = {
	/** A unique person identifier */
	id: PersonID;
	/** The person's name */
	name: string;
	/** Their email */
	email: string;
	/** An emoji to represent them */
	icon: string;
};

export default Person;
