import { command, query } from '$app/server';
import { storeInsertSchema, storeUpdateSchema } from '$lib/schemas/store.schema';
import { stopCron, upsertCron } from '$lib/server/cron';
import { db } from '$lib/server/db';
import { storeTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { existsSync } from 'fs';

export const selectStores = query(async () => {
	const stores = await db.select().from(storeTable);
	stores.forEach((store) => {
		if (existsSync(`.data/${store.id}`)) return;
		store.active = false;
		store.login = false;
		db.update(storeTable).set(store).where(eq(storeTable.id, store.id));
		stopCron(store.id);
	});

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

	if (result.active) {
		upsertCron(result.id, result.cron);
	} else {
		stopCron(result.id);
	}

	return result;
});
