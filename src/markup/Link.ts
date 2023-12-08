import Segment from './Segment';

class Link extends Segment {
	readonly text: string;
	readonly url: string;

	constructor(text: string, url: string) {
		super();
		this.text = text;
		this.url = url;
	}

	toString() {
		return `Link[${this.text}@${this.url}]`;
	}
}

export default Link;
