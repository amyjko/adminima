import type { Database as PostgresSchema } from './database.types';
import type Period from './Period';

type PostgresTables = PostgresSchema['public']['Tables'];

// THIS IS THE ONLY THING YOU EDIT
// <START>

type TableExtensions = {
	processes: {
		repeat: Period[];
	};
};
// <END>
// ☝️ this is the only thing you edit

type TakeDefinitionFromSecond<T extends object, P extends object> = Omit<T, keyof P> & P;

type NewTables = {
	[k in keyof PostgresTables]: {
		Row: k extends keyof TableExtensions
			? TakeDefinitionFromSecond<PostgresTables[k]['Row'], TableExtensions[k]>
			: PostgresTables[k]['Row'];
		Insert: k extends keyof TableExtensions
			? TakeDefinitionFromSecond<PostgresTables[k]['Insert'], TableExtensions[k]>
			: PostgresTables[k]['Insert'];
		Update: k extends keyof TableExtensions
			? Partial<TakeDefinitionFromSecond<PostgresTables[k]['Update'], TableExtensions[k]>>
			: PostgresTables[k]['Update'];
	};
};

export type Database = {
	public: Omit<PostgresSchema['public'], 'Tables'> & {
		Tables: NewTables;
	};
};

export type Table = keyof Database['public']['Tables'];
export type TableRow<T extends Table> = Database['public']['Tables'][T]['Row'];

export type TableView<View extends keyof Database['public']['Views']> =
	Database['public']['Views'][View]['Row'];
