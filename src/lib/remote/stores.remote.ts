import { command, query } from '$app/server';
import { EPIC_STORE_ID, STEAM_STORE_ID } from '$lib/const/store-ids';
import { storeInsertSchema } from '$lib/schemas/store.schema';
import * as stores from '$lib/server/stores';
import z from 'zod';

const storeId = z.enum([STEAM_STORE_ID, EPIC_STORE_ID]);

export const selectStores = query.live(stores.storesStream);

export const insertStore = command(storeInsertSchema, stores.insertStore);

export const loginStore = command(storeId, stores.loginStore);

export const updateCronStore = command(
	z.object({ id: storeId, cron: z.string() }),
	stores.updateCronStore
);

export const toggleStore = command(
	z.object({ id: storeId, active: z.boolean() }),
	stores.toggleStore
);

export const setLoggingStore = command(
	z.object({ id: storeId, logging: z.boolean() }),
	stores.setLoggingStore
);

export const setReddeemingStore = command(
	z.object({ id: storeId, redeeming: z.boolean() }),
	stores.setReddeemingStore
);

export const deleteStore = command(storeId, stores.deleteStore);
