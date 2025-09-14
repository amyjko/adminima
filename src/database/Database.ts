import type { MergeDeep } from 'type-fest';
import type { Database as DatabaseGenerated } from './database.types';
import type Period from './Period';

type Database = MergeDeep<
	DatabaseGenerated,
	{
		public: {
			Tables: {
				processes: {
					Row: {
						repeat: Period[];
					};
					Insert: {
						repeat?: Period[];
					};
					Update: {
						repeat?: Period[];
					};
				};
			};
		};
	}
>;

export type { Database as default };
