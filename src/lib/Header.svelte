<h2><slot /></h2>

<style>
	h2 {
		font-size: 24pt;
		font-weight: bold;
		text-transform: uppercase;
	}

	h2:not(:first-of-type) {
		margin-top: var(--spacing);
	}
</style>
