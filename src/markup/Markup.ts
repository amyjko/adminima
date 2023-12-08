import type Block from './Block';
import Part from './Part';

class Markup extends Part {
	readonly blocks: Block[];

	constructor(blocks: Block[]) {
		super();
		this.blocks = blocks;
	}

	toString() {
		return `Markup[${this.blocks.map((b) => b.toString()).join(', ')}]`;
	}
}

export default Markup;
