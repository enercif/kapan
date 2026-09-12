import { STORE_NAMES } from '$lib/const/maps';
import type { History, HistoryInsert } from '$lib/types/history.type';
import type { LogEntry } from '$lib/types/log.type';
import type { Status } from '$lib/types/status.type';
import type { StoreID } from '$lib/types/store-id.type';
import { desc } from 'drizzle-orm';
import { db } from './db';
import { historyTable } from './db/schema';

const listeners = new Set<() => void>();
let _history: History[] = [];

export async function* historyStream() {
	const history = await db.query.historyTable.findMany({
		orderBy: desc(historyTable.id)
	});

	_history = history.map((entry) => ({
		...entry,
		log: JSON.parse(entry.log)
	}));

	while (true) {
		yield _history;
		const { promise, resolve } = Promise.withResolvers<void>();
		listeners.add(resolve);
		await promise;
	}
}

export async function insertHistory(data: HistoryInsert) {
	const [newHistory] = await db.insert(historyTable).values(data).returning();
	_history.unshift({
		...newHistory,
		log: JSON.parse(newHistory.log)
	});
	for (const resolve of listeners) resolve();
	listeners.clear();
}

export async function insertHistoryHelper(
	storeId: StoreID,
	header: string,
	body: string,
	status: Status,
	log: LogEntry
) {
	await insertHistory({
		status,
		store: STORE_NAMES[storeId],
		header,
		body,
		log: JSON.stringify(log),
		created_at: new Date().toISOString()
	});
}
