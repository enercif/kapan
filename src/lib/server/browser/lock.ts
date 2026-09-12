let queue: Promise<unknown> = Promise.resolve();

export function acquire(): Promise<() => void> {
	let release!: () => void;
	const held = new Promise<void>((resolve) => (release = resolve));
	const turn = queue.then(() => release);
	queue = queue.then(
		() => held,
		() => held
	);
	return turn;
}
