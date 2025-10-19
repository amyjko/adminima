import type { ProcessRow } from './Organization';

const StopWords = [
	'i',
	'me',
	'my',
	'myself',
	'we',
	'our',
	'ours',
	'ourselves',
	'you',
	'your',
	'yours',
	'yourself',
	'yourselves',
	'he',
	'him',
	'his',
	'himself',
	'she',
	'her',
	'hers',
	'herself',
	'it',
	'its',
	'itself',
	'they',
	'them',
	'their',
	'theirs',
	'themselves',
	'what',
	'which',
	'who',
	'whom',
	'this',
	'that',
	'these',
	'those',
	'am',
	'is',
	'are',
	'was',
	'were',
	'be',
	'been',
	'being',
	'have',
	'has',
	'had',
	'having',
	'do',
	'does',
	'did',
	'doing',
	'a',
	'an',
	'the',
	'and',
	'but',
	'if',
	'or',
	'because',
	'as',
	'until',
	'while',
	'of',
	'at',
	'by',
	'for',
	'with',
	'about',
	'against',
	'between',
	'into',
	'through',
	'during',
	'before',
	'after',
	'above',
	'below',
	'to',
	'from',
	'up',
	'down',
	'in',
	'out',
	'on',
	'off',
	'over',
	'under',
	'again',
	'further',
	'then',
	'once',
	'here',
	'there',
	'when',
	'where',
	'why',
	'how',
	'all',
	'any',
	'both',
	'each',
	'few',
	'more',
	'most',
	'other',
	'some',
	'such',
	'no',
	'nor',
	'not',
	'only',
	'own',
	'same',
	'so',
	'than',
	'too',
	'very',
	's',
	't',
	'can',
	'will',
	'just',
	'don',
	'should',
	'now'
];

export default function getProcessDuplicates(
	processes: ProcessRow[]
): { words: string[]; processes: Set<ProcessRow> }[] {
	const processWords: { words: string[]; process: ProcessRow }[] = [];
	for (const process of processes) {
		// Split title by words, lowercase, filter out short words, sort alphabetically.
		const words = [
			...new Set(
				process.title
					.toLowerCase()
					.split(/\W+/)
					.filter((w) => w.length > 3 && !StopWords.includes(w))
					.toSorted()
			)
		];
		processWords.push({ words, process });
	}

	const duplicates: { words: string[]; processes: Set<ProcessRow> }[] = [];

	for (let a = 0; a < processWords.length; a++) {
		for (let b = a + 1; b < processWords.length; b++) {
			const common = processWords[a].words.filter((word) => processWords[b].words.includes(word));
			// If >=75% of the words are in common, count as a duplicate.
			if (
				common.length > 2 &&
				common.length / Math.min(processWords[a].words.length, processWords[b].words.length) >= 0.75
			) {
				// See if we already have this combination of processes
				const existing = duplicates.find((d) => d.words.join(',') === common.join(','));
				if (existing) existing.processes.add(processWords[b].process);
				else
					duplicates.push({
						words: common,
						processes: new Set([processWords[a].process, processWords[b].process])
					});
			}
		}
	}

	return Array.from(duplicates);
}
