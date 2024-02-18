import type Modification from './Modification';

type Tracked = {
	modifications: [Modification, ...Modification[]];
};

export type { Tracked as default };
