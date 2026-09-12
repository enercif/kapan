import { command } from '$app/server';
import { insertHistory as insert } from '$lib/server/history';
import z from 'zod';

const insertHistorySchema = z.object({
	store: z.string(),
	header: z.string(),
	body: z.string(),
	status: z.enum(['success', 'failure']),
	log: z.string(),
	created_at: z.string()
});

export const insertHistory = command(insertHistorySchema, insert);
