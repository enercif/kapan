import type { Settings } from '$lib/types/settings.type';

export const EMPTY_SETTINGS: Settings = {
	ntfy_enabled: false,
	ntfy_server_url: '',
	ntfy_topic: '',
	ntfy_token: '',
	telegram_enabled: false,
	telegram_chat_id: '',
	telegram_bot_token: ''
};
