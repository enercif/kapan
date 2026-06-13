import { command, query } from '$app/server';
import { EPIC_STORE_ID, STEAM_STORE_ID } from '$lib/const/store-ids';
import { storeInsertSchema } from '$lib/schemas/store.schema';
import { stopCron, upsertCron } from '$lib/server/cron';
import { db } from '$lib/server/db';
import { storeTable } from '$lib/server/db/schema';
import type { StoreSelect } from '$lib/types/store.types';
import { eq } from 'drizzle-orm';
import { existsSync, rmSync } from 'fs';
import z from 'zod';

const listeners = new Set<() => void>();
let _stores: StoreSelect[] = [];

export const selectStores = query.live(async function* () {
	const stores = await db.select().from(storeTable);

	_stores = stores;

	while (true) {
		yield _stores;
		const { promise, resolve } = Promise.withResolvers<void>();
		listeners.add(resolve);
		await promise;
	}
});

export const insertStore = command(storeInsertSchema, async (storeInsert) => {
	const [result] = await db.insert(storeTable).values(storeInsert).returning();
	_stores.push(result);
	notifyListeners();
});

export const loginStore = command(z.enum([STEAM_STORE_ID, EPIC_STORE_ID]), async (id) => {
	await db.update(storeTable).set({ login: true }).where(eq(storeTable.id, id));
	_stores = _stores.map((s) => (s.id === id ? { ...s, login: true } : s));
	notifyListeners();
});

export const updateCronStore = command(
	z.object({ id: z.enum([STEAM_STORE_ID, EPIC_STORE_ID]), cron: z.string() }),
	async ({ id, cron }) => {
		const [store] = await db
			.update(storeTable)
			.set({ cron })
			.where(eq(storeTable.id, id))
			.returning();
		if (store.active) {
			upsertCron(store.id, cron);
		}
		_stores = _stores.map((s) => (s.id === id ? { ...s, cron } : s));
		notifyListeners();
	}
);

export const toggleStore = command(
	z.object({ id: z.enum([STEAM_STORE_ID, EPIC_STORE_ID]), active: z.boolean() }),
	async ({ id, active }) => {
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

		_stores = _stores.map((s) => (s.id === id ? { ...s, active } : s));
		notifyListeners();
	}
);

export const setLoggingStore = command(
	z.object({ id: z.enum([STEAM_STORE_ID, EPIC_STORE_ID]), logging: z.boolean() }),
	async ({ id, logging }) => {
		await db.update(storeTable).set({ logging }).where(eq(storeTable.id, id));
		_stores = _stores.map((store) => (store.id === id ? { ...store, logging } : store));
		notifyListeners();
	}
);

export const setReddeemingStore = command(
	z.object({ id: z.enum([STEAM_STORE_ID, EPIC_STORE_ID]), redeeming: z.boolean() }),
	async ({ id, redeeming }) => {
		await db.update(storeTable).set({ redeeming }).where(eq(storeTable.id, id));
		_stores = _stores.map((store) => (store.id === id ? { ...store, redeeming } : store));
		notifyListeners();
	}
);

export const deleteStore = command(z.enum([STEAM_STORE_ID, EPIC_STORE_ID]), async (id) => {
	await db.delete(storeTable).where(eq(storeTable.id, id));
	stopCron(id);
	if (existsSync(`.data/${id}`)) {
		rmSync(`.data/${id}`, { recursive: true, force: true });
	}
	_stores = _stores.filter((s) => s.id !== id);
	notifyListeners();
});

function notifyListeners() {
	for (const resolve of listeners) resolve();
	listeners.clear();
}
