import { command, query } from '$app/server';
import { storeInsertSchema, storeUpdateSchema } from '$lib/schemas/store.schema';
import { db } from '$lib/server/db';
import { storeTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const selectStores = query(async () => {
	const stores = await db.select().from(storeTable);
	return stores;
});

export const insertStore = command(storeInsertSchema, async (storeInsert) => {
	const [result] = await db.insert(storeTable).values(storeInsert).returning();
	return result;
});

export const updateStore = command(storeUpdateSchema, async (storeUpdate) => {
	const [result] = await db
		.update(storeTable)
		.set(storeUpdate)
		.where(eq(storeTable.id, storeUpdate.id))
		.returning();
	return result;
});
