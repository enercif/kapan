import type {
	storeInsertSchema,
	storeSelectSchema,
	storeUpdateSchema
} from '$lib/schemas/store.schema';
import type z from 'zod';

export type StoreInsert = z.infer<typeof storeInsertSchema>;
export type StoreSelect = z.infer<typeof storeSelectSchema>;
export type StoreUpdate = z.infer<typeof storeUpdateSchema>;
