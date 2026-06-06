import type { Notification } from '$lib/types/notification.type';

export const notificationsStore = $state<{ value: Notification[] }>({ value: [] });
