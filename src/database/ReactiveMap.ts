import { get, writable, type Writable } from 'svelte/store';

export default class ReactiveMap<IDType, DataType> {
	readonly map = new Map<IDType, Writable<DataType | null | undefined>>();

	set(id: IDType, value: DataType): Writable<DataType | null | undefined> {
		const store = this.getStore(id);
		store.set(value);
		this.map.set(id, store);
		return store;
	}

	getStore(id: IDType) {
		let match = this.map.get(id);
		if (match === undefined) {
			match = writable(null);
			this.map.set(id, match);
		}
		return match;
	}

	get(id: IDType) {
		return get(this.getStore(id));
	}

	delete(id: IDType) {
		this.getStore(id).set(null);
	}

	values() {
		return Array.from(this.map.values())
			.map((role) => get(role))
			.filter((role): role is DataType => role !== null && role !== undefined);
	}
}
