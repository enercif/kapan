import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import { historyTable } from '$lib/server/db/schema';
import type { History } from '$lib/types/history.type';
import { desc, eq } from 'drizzle-orm';
import z from 'zod';

const insertHistorySchema = z.object({
	store: z.string(),
	header: z.string(),
	body: z.string(),
	status: z.string(),
	log: z.string(),
	created_at: z.string()
});

const listeners = new Set<() => void>();
let _history: History[] = [];

export const selectHistory = query.live(async function* () {
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
});

export const insertHistory = command(insertHistorySchema, async (data) => {
	const [newHistory] = await db.insert(historyTable).values(data).returning();
	_history.unshift({
		...newHistory,
		log: JSON.parse(newHistory.log)
	});
	for (const resolve of listeners) resolve();
	listeners.clear();
});

export const selectLastUpdate = query(z.string(), async (name) => {
	const lastEntry = await db.query.historyTable.findFirst({
		columns: {
			created_at: true,
			status: true
		},
		where: eq(historyTable.store, name),
		orderBy: desc(historyTable.id)
	});
	return lastEntry;
});
