import type { NotificationInsert } from '$lib/types/notification.type';
import { desc } from 'drizzle-orm';
import { db } from '../db';
import { notificationsTable } from '../db/schema';
import { notifyLive } from '../live';

export const readNotifications = () =>
	db.query.notificationsTable.findMany({ orderBy: desc(notificationsTable.id) });

export async function insertNotification(data: NotificationInsert) {
	await db.insert(notificationsTable).values(data);
	notifyLive();
}
