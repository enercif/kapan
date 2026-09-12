import { command, query } from '$app/server';
import { ntfySettingsSchema, telegramSettingsSchema } from '$lib/schemas/settings.schema';
import { decrypt, encrypt } from '$lib/server/crypto';
import { db } from '$lib/server/db';
import { settingsTable } from '$lib/server/db/schema';
import { notifications } from '$lib/server/notifications/registry';
import { eq } from 'drizzle-orm';

export const selectSettings = query(async () => {
	const [settings] = await db.query.settingsTable.findMany();
	return {
		ntfy_topic: decrypt(settings.ntfy_topic),
		ntfy_server_url: decrypt(settings.ntfy_server_url),
		ntfy_token: decrypt(settings.ntfy_token),
		ntfy_enabled: settings.ntfy_enabled,
		telegram_chat_id: decrypt(settings.telegram_chat_id),
		telegram_bot_token: decrypt(settings.telegram_bot_token),
		telegram_enabled: settings.telegram_enabled
	};
});

export const upsertNtfySettings = command(ntfySettingsSchema, async (data) => {
	const update = {
		ntfy_topic: encrypt(data.ntfy_topic) ?? '',
		ntfy_server_url: encrypt(data.ntfy_server_url) ?? '',
		ntfy_token: encrypt(data.ntfy_token) ?? '',
		ntfy_enabled: data.ntfy_enabled
	};

	if (data.ntfy_enabled && data.ntfy_server_url && data.ntfy_topic) {
		notifications.register({
			type: 'ntfy',
			serverUrl: data.ntfy_server_url,
			topic: data.ntfy_topic,
			token: data.ntfy_token
		});
		console.log('Ntfy registered');
	} else {
		notifications.unregister('ntfy');
		console.log('Ntfy unregistered');
	}

	await db.update(settingsTable).set(update).where(eq(settingsTable.id, 1));
});

export const upsertTelegramSettings = command(telegramSettingsSchema, async (data) => {
	const update = {
		telegram_chat_id: encrypt(data.telegram_chat_id) ?? '',
		telegram_bot_token: encrypt(data.telegram_bot_token) ?? '',
		telegram_enabled: data.telegram_enabled
	};

	if (data.telegram_enabled && data.telegram_chat_id && data.telegram_bot_token) {
		notifications.register({
			type: 'telegram',
			chatId: data.telegram_chat_id,
			botToken: data.telegram_bot_token
		});
		console.log('Telegram registered');
	} else {
		notifications.unregister('telegram');
		console.log('Telegram unregistered');
	}

	await db.update(settingsTable).set(update).where(eq(settingsTable.id, 1));
});
