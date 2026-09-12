import { command, query } from '$app/server';
import { insertNotification as insert, notificationsStream } from '$lib/server/notifications/log';
import z from 'zod';

const insertNotificationSchema = z.object({
	title: z.string(),
	message: z.string(),
	level: z.string(),
	status: z.enum(['success', 'failure']),
	created_at: z.string(),
	provider: z.string()
});

export const selectNotifications = query.live(notificationsStream);

export const insertNotification = command(insertNotificationSchema, insert);
