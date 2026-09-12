import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import { historyTable } from '$lib/server/db/schema';
import { historyStream, insertHistory as insert } from '$lib/server/history';
import { desc, eq } from 'drizzle-orm';
import z from 'zod';

const insertHistorySchema = z.object({
	store: z.string(),
	header: z.string(),
	body: z.string(),
	status: z.enum(['success', 'failure']),
	log: z.string(),
	created_at: z.string()
});

export const selectHistory = query.live(historyStream);

export const insertHistory = command(insertHistorySchema, insert);

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
