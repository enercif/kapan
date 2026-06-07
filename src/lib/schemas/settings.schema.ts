import z from 'zod';

export const ntfySettingsSchema = z.object({
	ntfy_topic: z.string().optional(),
	ntfy_server_url: z.string().optional(),
	ntfy_token: z.string().optional(),
	ntfy_enabled: z.boolean()
});

export const telegramSettingsSchema = z.object({
	telegram_chat_id: z.string().optional(),
	telegram_bot_token: z.string().optional(),
	telegram_enabled: z.boolean()
});
