import type { NotificationPayload } from '../types';
import { NotificationProvider } from './base';

export type NtfyConfig = {
	type: 'ntfy';
	serverUrl: string;
	topic: string;
	token?: string;
};

const PRIORITY_MAP = {
	info: 3,
	success: 3,
	warning: 4,
	error: 5
} as const;

export class NtfyProvider extends NotificationProvider {
	readonly id = 'ntfy';
	readonly name = 'Ntfy';

	constructor(private config: NtfyConfig) {
		super();
	}

	async send(payload: NotificationPayload) {
		console.log('Sending Ntfy notification:', payload);
		try {
			const res = await fetch(`${this.config.serverUrl}/${this.config.topic}`, {
				method: 'POST',
				headers: {
					Title: payload.title,
					Priority: String(PRIORITY_MAP[payload.level ?? 'info']),
					'Content-Type': 'text/plain',
					...(payload.tags && { Tags: payload.tags.join(',') }),
					...(payload.url && { Click: payload.url }),
					...(this.config.token && { Authorization: `Bearer ${this.config.token}` })
				},
				body: payload.message
			});

			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			await this.persistNotification(payload, 'success');
		} catch (err) {
			await this.persistNotification(payload, 'failure');
		}
	}
}
