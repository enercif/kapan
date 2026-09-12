import { STORE_NAMES } from '$lib/const/maps';
import type { HistoryInsert } from '$lib/types/history.type';
import type { LogEntry } from '$lib/types/log.type';
import type { Status } from '$lib/types/status.type';
import type { StoreID } from '$lib/types/store-id.type';
import { desc } from 'drizzle-orm';
import { db } from './db';
import { historyTable } from './db/schema';
import { notifyLive } from './live';

export const readHistory = async () => {
	const history = await db.query.historyTable.findMany({
		orderBy: desc(historyTable.id)
	});
	return history.map((entry) => ({ ...entry, log: JSON.parse(entry.log) }));
};

export async function insertHistory(data: HistoryInsert) {
	await db.insert(historyTable).values(data);
	notifyLive();
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
