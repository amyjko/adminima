import Block from './Block';
import type Segment from './Segment';

class Numbered extends Block {
	readonly items: Segment[][];

	constructor(items: Segment[][]) {
		super();
		this.items = items;
	}

	toString() {
		return `Numbered[${this.items.map((s) => s.toString()).join(', ')}]`;
	}
}

export default Numbered;
