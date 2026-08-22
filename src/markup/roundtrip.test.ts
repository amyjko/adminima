import { test, expect } from 'vitest';
import { parse } from './parser';
import { serialize } from './serializer';
import { corpus } from './testdata';

const Cases = corpus(2000);

test('serializing and reparsing preserves the tree', () => {
	const failures: string[] = [];
	for (const tree of Cases) {
		const source = serialize(tree);
		const reparsed = parse(source).toString();
		if (reparsed !== tree.toString())
			failures.push(
				`source:   ${JSON.stringify(source)}\nexpected: ${tree}\nactual:   ${reparsed}`
			);
	}
	expect(failures.slice(0, 5).join('\n\n')).toBe('');
});

test('serializing is idempotent', () => {
	const failures: string[] = [];
	for (const tree of Cases) {
		const once = serialize(tree);
		const twice = serialize(parse(once));
		if (once !== twice)
			failures.push(`once:  ${JSON.stringify(once)}\ntwice: ${JSON.stringify(twice)}`);
	}
	expect(failures.slice(0, 5).join('\n\n')).toBe('');
});
