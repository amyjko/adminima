export default function (timestamp: string): Date {
	const t = timestamp.split(/[- :+T]/);
	return new Date(
		Date.UTC(
			parseInt(t[0]),
			parseInt(t[1]) - 1,
			parseInt(t[2]),
			parseInt(t[3]),
			parseInt(t[4]),
			parseInt(t[5])
		)
	);
}
