import Block from './Block';
import type Segment from './Segment';

class Quote extends Block {
	readonly segments: Segment[];

	constructor(segments: Segment[]) {
		super();
		this.segments = segments;
	}

	toString() {
		return `Quote[${this.segments.map((s) => s.toString()).join(', ')}]`;
	}
}

export default Quote;
