import type { NotificationProvider } from './providers/base';
import { NtfyProvider } from './providers/ntfy';
import { TelegramProvider } from './providers/telegram';
import type { NotificationPayload, ProviderConfig } from './types';

export class NotificationRegistry {
	readonly providers = $state<Map<string, NotificationProvider>>(new Map());
	readonly providerList = $derived([...this.providers.values()]);
	readonly count = $derived(this.providers.size);
	readonly hasProviders = $derived(this.providers.size > 0);

	register(config: ProviderConfig): this {
		const provider = this.buildProvider(config);
		this.providers.set(provider.id, provider);
		return this;
	}

	unregister(providerId: string): this {
		this.providers.delete(providerId);
		return this;
	}

	isRegistered(providerId: string): boolean {
		return this.providers.has(providerId);
	}

	toggle(config: ProviderConfig): this {
		return this.isRegistered(config.type) ? this.unregister(config.type) : this.register(config);
	}

	async notify(payload: NotificationPayload) {
		if (!this.hasProviders) return [];
		await Promise.all([...this.providers.values()].map((p) => p.send(payload)));
	}

	buildProvider(config: ProviderConfig): NotificationProvider {
		switch (config.type) {
			case 'ntfy':
				return new NtfyProvider(config);
			case 'telegram':
				return new TelegramProvider(config);
		}
	}
}

export const notifications = new NotificationRegistry();
