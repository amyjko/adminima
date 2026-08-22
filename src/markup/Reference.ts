import Segment from './Segment';

/**
 * A reference to something in the organization — a role or a process — written `<text@target>`,
 * where the target is a short name or title rather than a URL. Kept distinct from a Link so that
 * the editor can treat references as atomic, and so that resolving them against the organization
 * happens in the view rather than in the grammar.
 */
class Reference extends Segment {
	readonly text: string;
	readonly target: string;

	constructor(text: string, target: string) {
		super();
		this.text = text;
		this.target = target;
	}

	toString() {
		return `Reference[${this.text}@${this.target}]`;
	}
}

export default Reference;
