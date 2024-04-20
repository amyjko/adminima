import type Change from '$types/Change';
import type Organization from '$types/Organization';
import type Person from '$types/Person';
import type Process from '$types/Process';
import type Role from '$types/Role';

const data: {
	roles: Role[];
	organizations: Organization[];
	people: Person[];
	changes: Change[];
	processes: Process[];
} = {
	roles: [
		{
			id: 'ada',
			organization: 'ischool',
			title: 'Associate Dean for Academics (ADA)',
			what: 'The Associate Dean for Academics (ADA) sets the vision, policies, and priorities of academics in the Information School, collaborating closely with the Assistant Dean for Academics to align staff operations with these decisions. The ADA also supports the faculty program chairs for each program, and helps triage requests for change from stakeholders in our education community. ',
			people: ['amy'],
			modifications: [],
			status: null,
			visibility: 'public'
		},
		{
			id: 'changepm',
			organization: 'ischool',
			title: 'Program Manager for Change',
			what: 'Helps the Associate Dean manage change and track success.',
			people: ['victor'],
			modifications: [],
			status: null,
			visibility: 'public'
		}
	],
	people: [
		{
			id: 'victor',
			name: 'Victor Aque',
			organization: 'ischool',
			bio: '',
			email: 'test@uw.edu',
			icon: '🥐',
			team: 'admin',
			supervisor: 'amy'
		},
		{
			id: 'amy',
			organization: 'ischool',
			name: 'Amy J. Ko',
			bio: '',
			email: 'ajko@uw.edu',
			icon: '🐱',
			team: 'admin',
			supervisor: null
		},
		{
			id: 'cris',
			organization: 'ischool',
			name: 'Cris Fowler',
			bio: '',
			email: 'crism@uw.edu',
			icon: '🦄',
			team: 'admin',
			supervisor: 'amy'
		},
		{
			id: 'marie',
			organization: 'ischool',
			name: 'Marie West',
			bio: '',
			email: 'westmar@uw.edu',
			icon: '🐴',
			team: 'teachinglearning',
			supervisor: null
		}
	],
	organizations: [
		{
			id: 'ischool',
			name: 'iSchool Academics',
			description:
				"Welcome to iSchool's internal academics administration page!\n\nOur mission is *equitable, excellent information education*. We try to achieve this by being _collaborative, iterative, and transparent_, building upon our collective knowledge with humility and embracing change when it gets us closer to our mission.\n\nHere you can learn about all of the roles in academics, the people who hold them, the processes they follow, and the policies that govern how we work. You can also propose changes to any of the above, and Amy and the leadership team will triage them.",
			admins: ['amy'],
			staff: ['victor', 'amy'],
			teams: [
				{
					id: 'admin',
					name: 'Administration',
					description:
						"The administration team is responsible for the overall management of the iSchool's academic programs."
				}
			],
			concerns: [
				{
					id: '1',
					name: 'Careers',
					description: "Anything related to students' career identity, planning, and goals."
				}
			],
			statuses: [
				{
					id: '1',
					name: 'pending',
					description: 'This is drafted, but not active yet.'
				},
				{
					id: '2',
					name: 'draft',
					description: "This is proposed, but we haven't approved it yet."
				}
			],
			modifications: [],
			visibility: 'public'
		}
	],
	changes: [
		{
			id: 'faster CAP',
			who: 'amy',
			watchers: [],
			organization: 'ischool',
			roles: ['ada'],
			processes: ['3'],
			title: 'CAP transparency',
			problem:
				'CAP is too opaque. Faculty are often confused about what courses are, why they are scheduled the way they are, what constraints we have on teaching assignments, and how we use the information that they submit.',
			comments: [
				{
					when: 0,
					who: 'victor',
					what: 'This is also true from the staff side. Many staff do not understand the process that we follow, aside from those who help run it.'
				}
			],
			status: 'triage',
			modifications: [
				{
					when: 0,
					person: 'amy',
					what: 'created',
					why: 'initialization',
					change: null
				}
			]
		}
	],
	processes: [
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
			modifications: [
				{
					when: 0,
					person: 'amy',
					what: 'Created',
					why: "Didn't exist",
					change: null
				}
			],
			visibility: 'public',
			status: null
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
			modifications: [
				{
					when: 0,
					person: 'amy',
					what: 'Created',
					why: "Didn't exist",
					change: null
				}
			],
			visibility: 'public',
			status: null
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
					visibility: 'public',
					how: [
						{
							accountable: 'ada',
							responsible: [],
							consulted: [],
							informed: [],
							what: "Send spreadsheets with previous year's assignments",
							how: [],
							visibility: 'public'
						},
						{
							accountable: 'ada',
							responsible: [],
							consulted: [],
							informed: [],
							what: 'Merge into list of requests',
							how: [],
							visibility: 'public'
						}
					]
				}
			],
			modifications: [
				{
					when: 0,
					person: 'amy',
					what: 'Created',
					why: "Didn't exist",
					change: null
				}
			],
			visibility: 'public',
			status: null
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
			modifications: [
				{
					when: 0,
					person: 'amy',
					what: 'Created',
					why: "Didn't exist",
					change: null
				}
			],
			visibility: 'public',
			status: null
		}
	]
};

export default data;
