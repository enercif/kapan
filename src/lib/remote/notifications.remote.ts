import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import { notificationsTable } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import z from 'zod';

const insertNotificationSchema = z.object({
	title: z.string(),
	message: z.string(),
	level: z.string(),
	status: z.string(),
	created_at: z.string(),
	provider: z.string()
});

export const selectAllNotifications = query(async () => {
	const notifications = await db.query.notificationsTable.findMany({
		orderBy: desc(notificationsTable.id)
	});
	return notifications;
});

export const insertNotification = command(insertNotificationSchema, async (data) => {
	const [newNotification] = await db.insert(notificationsTable).values(data).returning();
	return newNotification;
});
