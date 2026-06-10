import { insertNotification } from '$lib/remote/notifications.remote';
import type { NotificationInsert } from '$lib/types/notification.type';
import type { Status } from '$lib/types/status.type';
import type { NotificationPayload } from '../types';

export abstract class NotificationProvider {
	abstract readonly id: string;
	abstract readonly name: string;

	abstract send(payload: NotificationPayload): void;

	protected async persistNotification(payload: NotificationPayload, status: Status) {
		const notificationInsert: NotificationInsert = {
			title: payload.title,
			message: payload.message,
			level: payload.level ?? 'info',
			status: status,
			provider: this.name,
			created_at: new Date().toISOString()
		};
		await insertNotification(notificationInsert);
	}
}
