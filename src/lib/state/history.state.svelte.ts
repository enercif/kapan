import type { History } from '$lib/types/history.type';

export const historyStore = $state<{
	value: History[];
}>({
	value: []
});
