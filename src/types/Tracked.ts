import type Modification from './Modification';

type Tracked = {
	mods: [Modification, ...Modification[]];
};

export type { Tracked as default };
