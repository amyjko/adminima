import Block from './Block';
import type Segment from './Segment';

class Quote extends Block {
	readonly blocks: Segment[][];

	constructor(blocks: Segment[][]) {
		super();
		this.blocks = blocks;
	}

	toString() {
		return `Quote[${this.blocks.map((s) => s.toString()).join(', ')}]`;
	}
}

export default Quote;
