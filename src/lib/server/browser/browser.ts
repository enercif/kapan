import type { StoreID } from '$lib/types/store-id.type';
import path from 'path';
import { chromium, type BrowserContext } from 'playwright-ghost/patchright';
import plugins from 'playwright-ghost/plugins';

const PROFILES_DIR = process.env.PROFILES_DIR ?? '.data';

export async function openCtx(storeId: StoreID) {
	const profilePath = path.join(PROFILES_DIR, storeId);

	return chromium.launchPersistentContext(profilePath, {
		plugins: plugins.recommended(),
		headless: false,
		locale: 'en-US'
	});
}

export async function closeCtx(ctx: BrowserContext): Promise<void> {
	await ctx.close();
}
