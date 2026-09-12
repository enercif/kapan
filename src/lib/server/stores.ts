import type { StoreID } from '$lib/types/store-id.type';
import type { StoreInsert } from '$lib/types/store.types';
import { eq } from 'drizzle-orm';
import { existsSync, rmSync } from 'fs';
import { stopCron, upsertCron } from './cron';
import { db } from './db';
import { storeTable } from './db/schema';
import { notifyLive } from './live';

export const readStores = () => db.select().from(storeTable);

export async function insertStore(storeInsert: StoreInsert) {
	await db.insert(storeTable).values(storeInsert);
	notifyLive();
}

export async function loginStore(id: StoreID) {
	await db.update(storeTable).set({ login: true }).where(eq(storeTable.id, id));
	notifyLive();
}

export async function updateCronStore({ id, cron }: { id: StoreID; cron: string }) {
	const [store] = await db
		.update(storeTable)
		.set({ cron })
		.where(eq(storeTable.id, id))
		.returning();
	if (store.active) {
		upsertCron(store.id, cron);
	}
	notifyLive();
}

export async function toggleStore({ id, active }: { id: StoreID; active: boolean }) {
	const [store] = await db
		.update(storeTable)
		.set({ active })
		.where(eq(storeTable.id, id))
		.returning();

	if (store.active) {
		upsertCron(store.id, store.cron);
	} else {
		stopCron(store.id);
	}

	notifyLive();
}

export async function setLoggingStore({ id, logging }: { id: StoreID; logging: boolean }) {
	await db.update(storeTable).set({ logging }).where(eq(storeTable.id, id));
	notifyLive();
}

export async function setReddeemingStore({ id, redeeming }: { id: StoreID; redeeming: boolean }) {
	await db.update(storeTable).set({ redeeming }).where(eq(storeTable.id, id));
	notifyLive();
}

export async function deleteStore(id: StoreID) {
	await db.delete(storeTable).where(eq(storeTable.id, id));
	stopCron(id);
	if (existsSync(`.data/${id}`)) {
		rmSync(`.data/${id}`, { recursive: true, force: true });
	}
	notifyLive();
}
