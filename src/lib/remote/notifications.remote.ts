import { command, query } from '$app/server';
import { db } from '$lib/server/db';
import { notificationsTable } from '$lib/server/db/schema';
import type { Notification } from '$lib/types/notification.type';
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

const listeners = new Set<() => void>();
let _notifications: Notification[] = [];

export const selectNotifications = query.live(async function* () {
	const notifications = await db.query.notificationsTable.findMany({
		orderBy: desc(notificationsTable.id)
	});
	_notifications = notifications;

	while (true) {
		yield _notifications;
		const { promise, resolve } = Promise.withResolvers<void>();
		listeners.add(resolve);
		await promise;
	}
});

export const insertNotification = command(insertNotificationSchema, async (data) => {
	const [newNotification] = await db.insert(notificationsTable).values(data).returning();
	_notifications.unshift(newNotification);
	for (const resolve of listeners) resolve();
	listeners.clear();
});
