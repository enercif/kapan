import type { Notification, NotificationInsert } from '$lib/types/notification.type';
import { desc } from 'drizzle-orm';
import { db } from '../db';
import { notificationsTable } from '../db/schema';

const listeners = new Set<() => void>();
let _notifications: Notification[] = [];

export async function* notificationsStream() {
	_notifications = await db.query.notificationsTable.findMany({
		orderBy: desc(notificationsTable.id)
	});

	while (true) {
		yield _notifications;
		const { promise, resolve } = Promise.withResolvers<void>();
		listeners.add(resolve);
		await promise;
	}
}

export async function insertNotification(data: NotificationInsert) {
	const [newNotification] = await db.insert(notificationsTable).values(data).returning();
	_notifications.unshift(newNotification);
	for (const resolve of listeners) resolve();
	listeners.clear();
}
