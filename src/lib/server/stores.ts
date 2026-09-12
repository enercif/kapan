import type { StoreID } from '$lib/types/store-id.type';
import type { StoreInsert, StoreSelect } from '$lib/types/store.types';
import { eq } from 'drizzle-orm';
import { existsSync, rmSync } from 'fs';
import { stopCron, upsertCron } from './cron';
import { db } from './db';
import { storeTable } from './db/schema';

const listeners = new Set<() => void>();
let _stores: StoreSelect[] = [];

function notifyListeners() {
	for (const resolve of listeners) resolve();
	listeners.clear();
}

export async function* storesStream() {
	_stores = await db.select().from(storeTable);

	while (true) {
		yield _stores;
		const { promise, resolve } = Promise.withResolvers<void>();
		listeners.add(resolve);
		await promise;
	}
}

export async function insertStore(storeInsert: StoreInsert) {
	const [result] = await db.insert(storeTable).values(storeInsert).returning();
	_stores.push(result);
	notifyListeners();
}

export async function loginStore(id: StoreID) {
	await db.update(storeTable).set({ login: true }).where(eq(storeTable.id, id));
	_stores = _stores.map((s) => (s.id === id ? { ...s, login: true } : s));
	notifyListeners();
}

export async function updateCronStore({ id, cron }: { id: StoreID; cron: string }) {
	const [store] = await db.update(storeTable).set({ cron }).where(eq(storeTable.id, id)).returning();
	if (store.active) {
		upsertCron(store.id, cron);
	}
	_stores = _stores.map((s) => (s.id === id ? { ...s, cron } : s));
	notifyListeners();
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

	_stores = _stores.map((s) => (s.id === id ? { ...s, active } : s));
	notifyListeners();
}

export async function setLoggingStore({ id, logging }: { id: StoreID; logging: boolean }) {
	await db.update(storeTable).set({ logging }).where(eq(storeTable.id, id));
	_stores = _stores.map((store) => (store.id === id ? { ...store, logging } : store));
	notifyListeners();
}

export async function setReddeemingStore({ id, redeeming }: { id: StoreID; redeeming: boolean }) {
	await db.update(storeTable).set({ redeeming }).where(eq(storeTable.id, id));
	_stores = _stores.map((store) => (store.id === id ? { ...store, redeeming } : store));
	notifyListeners();
}

export async function deleteStore(id: StoreID) {
	await db.delete(storeTable).where(eq(storeTable.id, id));
	stopCron(id);
	if (existsSync(`.data/${id}`)) {
		rmSync(`.data/${id}`, { recursive: true, force: true });
	}
	_stores = _stores.filter((s) => s.id !== id);
	notifyListeners();
}
