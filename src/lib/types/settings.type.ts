export type NtfySettings = {
	ntfy_topic?: string;
	ntfy_server_url?: string;
	ntfy_token?: string;
	ntfy_enabled: boolean;
};

export type TelegramSettings = {
	telegram_chat_id?: string;
	telegram_bot_token?: string;
	telegram_enabled: boolean;
};

export type Settings = NtfySettings & TelegramSettings;
