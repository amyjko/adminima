import fs from 'fs';
import fastcsv from 'fast-csv';

if (process.argv.length < 2) {
	console.error('Usage: node csv2org.js <filename>');
	process.exit(1);
}

const filename = process.argv[2];
const orgName = filename.split('-').at(-1).trim().split('.')[0];

const stream = fs.createReadStream(process.argv[2]);

const rows = [];
let headers = null;
const csv = fastcsv
	.parse({ headers: true })
	.on('data', function (row) {
		rows.push(row);
	})

	.on(
		'end',

		function () {
			convert(rows);
		}
	)
	.on('headers', (heads) => {
		headers = heads;
	})
	.on('error', function (error) {
		console.error(error);
	});

function roleNameToID(name) {
	return name.replaceAll(' ', '').toLowerCase();
}

stream.pipe(csv);

function convert(rows) {
	const withoutTallies = rows.slice(4);

	const processes = [];
	const concerns = [];
	let statuses = [];
	for (const row of withoutTallies) {
		if (/Proposed|Discussed|Pending|Final/.test(row['Status'])) {
			statuses = [...statuses, row];
			processes.push({
				id: '' + processes.length,
				icon: '',
				organization: 'ischool',
				concern: concerns.at(-1).id,
				start: null,
				repeat: null,
				title: row['Task'],
				status: row['Status'],
				accountable: roleNameToID(Object.keys(row).find((key) => row[key] === 'A') ?? ''),
				responsible: Object.keys(row)
					.filter((key) => row[key] === 'R')
					.map((name) => roleNameToID(name)),
				consulted: Object.keys(row)
					.filter((key) => row[key] === 'C')
					.map((name) => roleNameToID(name)),
				informed: Object.keys(row)
					.filter((key) => row[key] === 'I')
					.map((name) => roleNameToID(name)),
				what: row['Notes'],
				how: [],
				visibility: 'public',
				revisions: []
			});
		} else {
			const [name, description] = row['Status'].split('\n');
			concerns.push({ id: name.toLowerCase(), name, description });
		}
	}

	const roles = [];
	// Skip the first three columns
	for (const header of headers.slice(3)) {
		roles.push({
			id: roleNameToID(header),
			organization: 'ischool',
			title: header,
			what: '',
			people: [],
			status: 'Proposed',
			visibility: 'public',
			revisions: []
		});
	}

	const data = {
		organizations: [
			{
				id: 'ischool',
				name: orgName,
				description: '',
				admins: [],
				staff: [],
				teams: [],
				concerns: concerns,
				statuses: [
					{
						id: 'Draft',
						name: 'Drafted',
						description: 'Still working on it'
					},
					{
						id: 'Discussed',
						name: 'Discussed',
						description: 'Discussed with stakeholders'
					},
					{
						id: 'Proposed',
						name: 'Proposed',
						description: 'Ready for feedback'
					},
					{
						id: 'Approved',
						name: 'Approved',
						description: 'Approved and ready to implement'
					},
					{
						id: 'Implemented',
						name: 'Implemented',
						description: 'Implemented'
					}
				],
				visibility: 'public',
				revisions: []
			}
		],
		processes,
		roles,
		changes: [],
		people: []
	};

	const jsonData = JSON.stringify(data);
	fs.writeFile('src/database/mock.json', jsonData, (err) => {
		if (err) {
			console.error(err);
		} else {
			console.log('Data written to file successfully.');
		}
	});
}
