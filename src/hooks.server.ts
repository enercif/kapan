import { decrypt } from '$lib/server/crypto';
import { db } from '$lib/server/db';
import { settingsTable } from '$lib/server/db/schema';
import { notifications } from '$lib/server/notifications/registry';
import type { ServerInit } from '@sveltejs/kit';

export const init: ServerInit = async () => {
	db.insert(settingsTable).values({ id: 1 }).onConflictDoNothing().run();

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
};
