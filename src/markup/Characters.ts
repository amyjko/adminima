import Segment from './Segment';

type Format = '*' | '_' | '';

class Text extends Segment {
	readonly format: Format;
	readonly text: string;

	constructor(format: Format, text: string) {
		super();
		this.format = format;
		this.text = text;
	}

	toString() {
		return `Text[${this.format}${this.text}${this.format}]`;
	}
}

export default Text;
