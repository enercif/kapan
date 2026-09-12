import { dev } from '$app/env';
import { PROFILES_DIR } from '$lib/const/profile';
import type { StoreID } from '$lib/types/store-id.type';
import { execSync } from 'child_process';
import path from 'path';
import { firefox, type BrowserContext } from 'playwright';

export async function openCtx(storeId: StoreID) {
	const profilePath = path.join(PROFILES_DIR, storeId);

	let ctx: BrowserContext;

	if (dev) {
		ctx = await firefox.launchPersistentContext(profilePath, {
			headless: false,
			locale: 'en-US'
		});
	} else {
		// `fetch` prints the engine path as its last stdout line (the old `path` subcommand is gone)
		const firefoxPath = execSync('python3 -m invisible_playwright fetch')
			.toString()
			.trim()
			.split('\n')
			.pop()!
			.trim();
		ctx = await firefox.launchPersistentContext(profilePath, {
			headless: false,
			locale: 'en-US',
			executablePath: firefoxPath,
			env: {
				DISPLAY: ':99',
				STEALTHFOX_SEED: '42',
				STEALTHFOX_TIMEZONE: 'America/New_York'
			}
		});
	}

	return ctx;
}

export async function closeCtx(ctx: BrowserContext): Promise<void> {
	await ctx.close();
}
