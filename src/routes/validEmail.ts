export default function validEmail(text: string) {
	return /^[^<>]+@.+\.[^<>]+$/.test(text);
}

export function validNameAndEmail(text: string) {
	return /^.+ <.+@.+\..+>$/.test(text);
}
