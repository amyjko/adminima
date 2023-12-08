import Block from './Block';
import type Segment from './Segment';

class Paragraph extends Block {
	readonly segments: Segment[];

	constructor(segments: Segment[]) {
		super();
		this.segments = segments;
	}

	toString() {
		return `Paragraph[${this.segments.map((s) => s.toString()).join(', ')}]`;
	}
}

export default Paragraph;
