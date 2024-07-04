import Block from './Block';
import type Segment from './Segment';

class Heading extends Block {
	readonly level: 1 | 2;
	readonly text: Segment[];

	constructor(level: 1 | 2, text: Segment[]) {
		super();
		this.level = level;
		this.text = text;
	}

	toString() {
		return `Header[${'#'.repeat(this.level)} ${this.text.map((s) => s.toString()).join(', ')}]`;
	}
}

export default Heading;
