import { test, expect } from 'vitest';
import { matches, find, targetFor, type Short } from './references';

const Registrar: Short = { id: '1', title: 'Registrar of Deeds', short: ['registrar', 'reg'] };
const Chief: Short = { id: '2', title: 'Chief of Staff', short: [] };
const Blank: Short = { id: '3', title: 'Untitled', short: [''] };

test.each([
	['a short name', Registrar, 'registrar', true],
	['another short name', Registrar, 'reg', true],
	['a short name in any case', Registrar, 'REGISTRAR', true],
	['a short name with spare spacing', Registrar, '  registrar  ', true],
	['the title', Registrar, 'Registrar of Deeds', true],
	['the title in any case', Chief, 'chief of staff', true],
	['something else entirely', Registrar, 'treasurer', false],
	['nothing at all', Registrar, '', false],
	['only spaces', Registrar, '   ', false]
])('matching %s', (_name, item: Short, target: string, expected: boolean) => {
	expect(matches(item, target)).toBe(expected);
});

test('finding picks out the one that matches', () => {
	expect(find([Registrar, Chief], 'reg')?.id).toBe('1');
	expect(find([Registrar, Chief], 'Chief of Staff')?.id).toBe('2');
	expect(find([Registrar, Chief], 'nobody')).toBeUndefined();
});

test('a reference is written with a short name when there is one', () => {
	expect(targetFor(Registrar)).toBe('registrar');
	expect(targetFor(Chief)).toBe('Chief of Staff');
});

test('an empty short name is not a name to refer to', () => {
	// It would render as unknown, since matching ignores it too.
	expect(targetFor(Blank)).toBe('Untitled');
	expect(matches(Blank, '')).toBe(false);
});

test('what the picker offers is what the view will resolve', () => {
	// The two rules have to agree, or the picker offers references that render as unknown.
	for (const item of [Registrar, Chief, Blank])
		expect(matches(item, targetFor(item))).toBe(true);
});
