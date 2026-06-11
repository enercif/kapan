import { PROFILES_DIR } from '$lib/const/profile';
import type { StoreID } from '$lib/types/store-id.type';
import { chromium, type BrowserContext } from 'patchright';
import path from 'path';

export async function openCtx(storeId: StoreID) {
	const profilePath = path.join(PROFILES_DIR, storeId);

	const ctx = await chromium.launchPersistentContext(profilePath, {
		headless: false,
		locale: 'en-US',
		executablePath: '/usr/bin/chromium'
	});
	return ctx;
}

export async function closeCtx(ctx: BrowserContext): Promise<void> {
	await ctx.close();
}
