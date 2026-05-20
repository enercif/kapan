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
	await db.insert(storeTable).values(storeInsert);
	void selectStores().refresh();
});

export const updateStore = command(storeUpdateSchema, async (storeUpdate) => {
	await db.update(storeTable).set(storeUpdate).where(eq(storeTable.id, storeUpdate.id));
	void selectStores().refresh();
});
