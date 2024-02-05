import type Change from './Change';

type Tracked = {
	changes: [Change, ...Change[]];
};

export type { Tracked as default };
