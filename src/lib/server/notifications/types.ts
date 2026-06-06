import type { NtfyConfig } from './providers/ntfy';
import type { TelegramConfig } from './providers/telegram';

export type NotificationLevel = 'info' | 'warning' | 'error' | 'success';

export interface NotificationPayload {
	title: string;
	message: string;
	level?: NotificationLevel;
	tags?: string[];
	url?: string;
}

export interface NotificationResult {
	provider: string;
	success: boolean;
	error?: string;
}

export type ProviderConfig = NtfyConfig | TelegramConfig;
