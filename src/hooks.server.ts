import { EMPTY_SETTINGS } from '$lib/const/settings';
import { upsertCron } from '$lib/server/cron';
import { decrypt } from '$lib/server/crypto';
import { db } from '$lib/server/db';
import { settingsTable } from '$lib/server/db/schema';
import { notifications } from '$lib/server/notifications/registry';
import type { ServerInit } from '@sveltejs/kit';

async function initNotifications() {
	db.insert(settingsTable)
		.values({ id: 1, ...EMPTY_SETTINGS })
		.onConflictDoNothing()
		.run();

	const [settings] = await db.query.settingsTable.findMany();
	if (settings.ntfy_enabled && settings.ntfy_server_url && settings.ntfy_topic) {
		console.log('Ntfy is enabled');
		notifications.register({
			type: 'ntfy',
			serverUrl: decrypt(settings.ntfy_server_url),
			topic: decrypt(settings.ntfy_topic),
			token: decrypt(settings.ntfy_token)
		});
	}

	if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
		console.log('Telegram is enabled');
		notifications.register({
			type: 'telegram',
			botToken: decrypt(settings.telegram_bot_token),
			chatId: decrypt(settings.telegram_chat_id)
		});
	}
}

async function initCrons() {
	const stores = await db.query.storeTable.findMany();

	stores.forEach((store) => {
		if (!store.cron || !store.active || !store.login) return;
		upsertCron(store.id, store.cron);
		console.log(`Cron for store ${store.id} initialized with expression: ${store.cron}`);
	});
}

export const init: ServerInit = async () => {
	initNotifications();
	initCrons();
};
