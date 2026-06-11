import { command, query } from '$app/server';
import { EPIC_STORE_ID, STEAM_STORE_ID } from '$lib/const/store-ids';
import { storeInsertSchema, storeUpdateSchema } from '$lib/schemas/store.schema';
import { stopCron, upsertCron } from '$lib/server/cron';
import { db } from '$lib/server/db';
import { storeTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { existsSync, rmSync } from 'fs';
import z from 'zod';

export const selectStores = query(async () => {
	const stores = await db.select().from(storeTable);
	stores.forEach((store) => {
		if (existsSync(`.data/${store.id}`)) return;

		db.update(storeTable)
			.set({ login: false, active: false })
			.where(eq(storeTable.id, store.id))
			.then(() => {
				stopCron(store.id);
			});
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

export const deleteStore = command(z.enum([STEAM_STORE_ID, EPIC_STORE_ID]), async (id) => {
	await db.delete(storeTable).where(eq(storeTable.id, id));
	stopCron(id);
	if (existsSync(`.data/${id}`)) {
		rmSync(`.data/${id}`, { recursive: true, force: true });
	}
});
