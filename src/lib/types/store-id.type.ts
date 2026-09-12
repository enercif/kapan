import type { AVAILABLE_STORES } from '$lib/const/store-ids';

export type StoreID = (typeof AVAILABLE_STORES)[number];
