import Block from './Block';
import type Segment from './Segment';

class Bullets extends Block {
	readonly items: Segment[][];

	constructor(items: Segment[][]) {
		super();
		this.items = items;
	}

	toString() {
		return `Bullets[${this.items.map((s) => s.toString()).join(', ')}]`;
	}
}

export default Bullets;
