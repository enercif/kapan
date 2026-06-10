import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import { historyTable } from '$lib/server/db/schema';
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

export const selectAllHistory = query(async () => {
	const history = await db.query.historyTable.findMany({
		orderBy: desc(historyTable.id)
	});
	return history.map((entry) => ({
		...entry,
		log: JSON.parse(entry.log)
	}));
});

export const insertHistory = command(insertHistorySchema, async (data) => {
	const [newHistory] = await db.insert(historyTable).values(data).returning();
	return newHistory;
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
