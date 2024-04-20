import type Modification from '$types/Modification';
import type Process from '$types/Process';

const DefaultModification: [Modification, ...Modification[]] = [
	{
		when: 0,
		person: 'amy',
		what: 'Created',
		why: "Didn't exist",
		change: null
	}
];

const MockTasks: Process[] = [
	{
		id: '1',
		start: { type: 'date', date: 13, month: 10, year: 2023 },
		repeat: null,
		icon: '🧑🏻‍🏫',
		organization: 'ischool',
		concern: '1',
		title: 'Faculty peer reviews',
		what: 'Required by faculty code',
		accountable: 'ada',
		responsible: ['changepm'],
		consulted: [],
		informed: [],
		how: [],
		modifications: DefaultModification,
		public: true
	},
	{
		id: '2',
		start: { type: 'date', date: 30, month: 9, year: 2023 },
		repeat: null,
		icon: '🧑🏻‍🏫',
		organization: 'ischool',
		concern: '1',
		title: 'Welcome',
		what: 'Give students a sense of community',
		accountable: 'ada',
		responsible: ['changepm'],
		consulted: [],
		informed: [],
		how: [],
		modifications: DefaultModification,
		public: true
	},
	{
		id: '3',
		start: null,
		repeat: { type: 'annually', month: 7, day: 5 },
		icon: '🧑🏻‍🏫',
		title: 'Course Assignment Process (CAP)',
		organization: 'ischool',
		concern: '1',
		what: 'CAP is the process by which we make annual teaching assignments (with the exception of summer course assignments). We run it annually with the goal of having teaching assignments largely finalized one year in advance of instruction, since UW requires classroom requests to be submitted one year in advance for large lecture halls.\n\nIn general, CAP is overconstrained by faculty teaching requests, program needs, student demand, and classroom availabilty, making it a contentions process. We prioritize junior faculty and the sustainability of school revenue over other concerns.',
		accountable: 'ada',
		responsible: ['changepm'],
		consulted: [],
		informed: [],
		how: [
			{
				accountable: 'ada',
				responsible: [],
				consulted: [],
				informed: [],
				what: 'Ask everyone what they want to teach',
				how: [
					{
						accountable: 'ada',
						responsible: [],
						consulted: [],
						informed: [],
						what: "Send spreadsheets with previous year's assignments",
						how: []
					},
					{
						accountable: 'ada',
						responsible: [],
						consulted: [],
						informed: [],
						what: 'Merge into list of requests',
						how: []
					}
				]
			}
		],
		modifications: DefaultModification,
		public: true
	},
	{
		id: '4',
		start: null,
		repeat: null,
		icon: '🧑🏻‍🏫',
		organization: 'ischool',
		concern: '1',
		title: 'Instructor is ill',
		what: 'people get sick',
		accountable: 'ada',
		responsible: ['changepm'],
		consulted: [],
		informed: [],
		how: [],
		modifications: DefaultModification,
		public: true
	}
];

export default MockTasks;
