const listeners = new Set<() => void>();

export function notifyLive() {
	for (const resolve of listeners) resolve();
	listeners.clear();
}

export function live<T>(read: () => Promise<T>) {
	return async function* () {
		while (true) {
			yield await read();
			const { promise, resolve } = Promise.withResolvers<void>();
			listeners.add(resolve);
			await promise;
		}
	};
}
