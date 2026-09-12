import type { NotificationPayload } from '../types';
import { NotificationProvider } from './base';

export type TelegramConfig = {
	type: 'telegram';
	botToken: string;
	chatId: string;
};

const EMOJI_MAP = {
	info: 'ℹ️',
	success: '✅',
	warning: '⚠️',
	error: '🚨'
} as const;

export class TelegramProvider extends NotificationProvider {
	readonly id = 'telegram';
	readonly name = 'Telegram';

	constructor(private config: TelegramConfig) {
		super();
	}

	async send(payload: NotificationPayload) {
		try {
			const emoji = EMOJI_MAP[payload.level ?? 'info'];
			const text = [
				`${emoji} *${this.escape(payload.title)}*`,
				this.escape(payload.message),
				payload.url ? `[Mehr erfahren](${payload.url})` : null
			]
				.filter(Boolean)
				.join('\n\n');

			const res = await fetch(`https://api.telegram.org/bot${this.config.botToken}/sendMessage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chat_id: this.config.chatId,
					text,
					parse_mode: 'MarkdownV2'
				})
			});

			const data = await res.json();
			if (!data.ok) throw new Error(data.description);
			await this.persistNotification(payload, 'success');
		} catch (err) {
			await this.persistNotification(payload, 'failure');
		}
	}

	private escape(text: string): string {
		return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
	}
}
