import { z } from 'zod';

const storeBaseSchema = z.object({
	cron: z.string().default('0 9 * * *'),
	login: z.boolean().default(false),
	active: z.boolean().default(false),
	redeeming: z.boolean().default(false),
	logging: z.boolean().default(false)
});

export const storeInsertSchema = z.object({
	id: z.enum(['steam', 'epic'])
});

export const storeSelectSchema = storeBaseSchema.extend({
	id: z.enum(['steam', 'epic'])
});

export const storeUpdateSchema = storeSelectSchema;
