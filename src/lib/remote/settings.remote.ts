import { command, query } from '$app/server';
import { ntfySettingsSchema, telegramSettingsSchema } from '$lib/schemas/settings.schema';
import { decrypt, encrypt } from '$lib/server/crypto';
import { db } from '$lib/server/db';
import { settingsTable } from '$lib/server/db/schema';

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
	const set = {
		ntfy_topic: encrypt(data.ntfy_topic),
		ntfy_server_url: encrypt(data.ntfy_server_url),
		ntfy_token: encrypt(data.ntfy_token),
		ntfy_enabled: data.ntfy_enabled
	};
	await db
		.insert(settingsTable)
		.values({ id: 1, ...set })
		.onConflictDoUpdate({ target: settingsTable.id, set });
});

export const upsertTelegramSettings = command(telegramSettingsSchema, async (data) => {
	const set = {
		telegram_chat_id: encrypt(data.telegram_chat_id),
		telegram_bot_token: encrypt(data.telegram_bot_token),
		telegram_enabled: data.telegram_enabled
	};
	await db
		.insert(settingsTable)
		.values({ id: 1, ...set })
		.onConflictDoUpdate({ target: settingsTable.id, set });
});
