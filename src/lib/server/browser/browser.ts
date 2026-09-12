import { dev } from '$app/env';
import { PROFILES_DIR } from '$lib/const/profile';
import type { StoreID } from '$lib/types/store-id.type';
import { execSync } from 'child_process';
import path from 'path';
import { firefox, type BrowserContext } from 'playwright';
import { startDisplay, stopDisplay } from './display';
import { acquire } from './lock';

const releases = new WeakMap<BrowserContext, () => void>();

let firefoxPath: string | undefined;

function resolveFirefox(): string {
	firefoxPath ??=
		process.env.FIREFOX_PATH ??
		execSync('python3 -m invisible_playwright fetch').toString().trim().split('\n').pop()!.trim();
	return firefoxPath;
}

export async function openCtx(storeId: StoreID) {
	const profilePath = path.join(PROFILES_DIR, storeId);

	if (dev) {
		return await firefox.launchPersistentContext(profilePath, {
			headless: false,
			locale: 'en-US'
		});
	}

	const release = await acquire();

	try {
		await startDisplay();
		const ctx = await firefox.launchPersistentContext(profilePath, {
			headless: false,
			locale: 'en-US',
			executablePath: resolveFirefox(),
			env: {
				DISPLAY: ':99',
				STEALTHFOX_SEED: '42',
				STEALTHFOX_TIMEZONE: 'America/New_York'
			}
		});
		releases.set(ctx, release);
		return ctx;
	} catch (error) {
		stopDisplay();
		release();
		throw error;
	}
}

export async function closeCtx(ctx: BrowserContext): Promise<void> {
	try {
		await ctx.close();
	} finally {
		if (!dev) stopDisplay();
		releases.get(ctx)?.();
		releases.delete(ctx);
	}
}
