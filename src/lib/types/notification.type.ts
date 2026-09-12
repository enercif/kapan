import type { Status } from './status.type';

type NotificationBase = {
	title: string;
	message: string;
	level: string;
	created_at: string;
	provider: string;
};

export type Notification = NotificationBase & {
	id: number;
	status: string;
};

export type NotificationInsert = NotificationBase & {
	status: Status;
};
