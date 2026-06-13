import { command } from '$app/server';
import { EPIC_STORE_ID } from '$lib/const/store-ids';
import { closeCtx, openCtx } from '$lib/server/browser/browser';
import { notifications } from '$lib/server/notifications/registry';
import type { LoginLog, RedeemLog } from '$lib/types/log.type';
import { insertHistoryHelper } from '$lib/utils';
import z from 'zod';
import { loginStore, setLoggingStore, setReddeemingStore } from './stores.remote';

const URL_REDEEM =
	'https://store.epicgames.com/browse?sortBy=currentPrice&sortDir=ASC&priceTier=tierDiscouted&category=Game&count=40';
const URL_LOGIN = 'https://www.epicgames.com/id/login?lang=en';
const URL_ACCOUNT = 'https://accounts.epicgames.com/account/personal';

export const loginEpic = command(async () => {
	setLoggingStore({ id: EPIC_STORE_ID, logging: true });

	let log: LoginLog = {
		type: 'login',
		error: undefined
	};
	const ctx = await openCtx(EPIC_STORE_ID);

	try {
		const page = await ctx.newPage();
		await page.waitForTimeout(2000);
		await page.goto(URL_LOGIN, { waitUntil: 'domcontentloaded' });
		await page.waitForURL(URL_ACCOUNT, { timeout: 240_000 });

		insertHistoryHelper(EPIC_STORE_ID, 'Epic Games Login', 'Login successful', 'success', log);
		loginStore(EPIC_STORE_ID);
	} catch (error) {
		log.error = error instanceof Error ? error.message : 'Unknown error';
		insertHistoryHelper(
			EPIC_STORE_ID,
			'Epic Games Login',
			'An error occurred during login. Check logs for details',
			'failure',
			log
		);
	} finally {
		setLoggingStore({ id: EPIC_STORE_ID, logging: false });
		await closeCtx(ctx);
	}
});

export const redeemEpic = command(z.boolean(), async (manual): Promise<boolean> => {
	setReddeemingStore({ id: EPIC_STORE_ID, redeeming: true });
	let log: RedeemLog = {
		type: 'redeem',
		foundLinks: [],
		error: undefined,
		processedGames: []
	};
	const ctx = await openCtx(EPIC_STORE_ID);
	let redeemedGames: string[] = [];

	try {
		let purchaseFrame: any = undefined;

		const page = await ctx.newPage();

		page.on('framenavigated', (frame) => {
			if (frame.url().includes('/purchase') && !frame.url().includes('free-checkout')) {
				purchaseFrame = frame;
			}
		});

		await page.goto(URL_REDEEM, { waitUntil: 'domcontentloaded' });
		await page.waitForSelector('a:has(span:text("-100%"))', { timeout: 15_000 });

		const links = await page
			.locator('a:has(span:text("-100%"))')
			.evaluateAll((anchors) => (anchors as HTMLAnchorElement[]).map((a) => a.href));

		log.foundLinks = links;

		for (const link of links) {
			await page.goto(link, { waitUntil: 'domcontentloaded' });

			const title =
				(await page.locator('[data-testid="pdp-title"]').first().textContent()) || 'Unknown Title';

			const purchaseBtn = page.locator('button[data-testid="purchase-cta-button"]');
			await purchaseBtn.waitFor({ timeout: 30_000 });
			const btnText = (await purchaseBtn.innerText()).toLowerCase();

			if (btnText.includes('library')) {
				log.processedGames.push({
					title,
					status: 'already_in_library'
				});
				continue;
			}

			await purchaseBtn.click({ delay: 11 });

			try {
				const continueButton = page.locator('button:has-text("Continue")').first();
				await continueButton.click({ delay: 11, timeout: 10_000 });
			} catch {}

			await page.waitForLoadState('networkidle');
			if (purchaseFrame !== undefined) {
				const libraryButton = purchaseFrame
					.locator('button:has(span:text("Add to library"))')
					.first();
				await libraryButton.waitFor({ timeout: 30_000 });
				await libraryButton.click({ delay: 11 });

				try {
					const acceptButton = purchaseFrame.locator('button:has-text("I accept")');
					await acceptButton.waitFor({ timeout: 30_000 });
					await acceptButton.click({ delay: 11 });
				} catch {}
			}

			await page.waitForSelector('h3:has-text("Download the Epic Games Launcher to play")', {
				timeout: 30_000
			});

			redeemedGames.push(title);
			log.processedGames.push({
				title,
				status: 'redeemed'
			});
		}

		if (redeemedGames.length > 0 && !manual) {
			notifications.notify({
				title: 'Epic Redeem Complete',
				message: redeemedGames.join('\n'),
				level: 'info'
			});
		}

		insertHistoryHelper(
			EPIC_STORE_ID,
			'Redeem Complete',
			redeemedGames.length === 0 ? 'No new games redeemed' : redeemedGames.join('\n'),
			'success',
			log
		);

		return true;
	} catch (error) {
		log.error = error instanceof Error ? error.message : 'Unknown error';

		if (!manual) {
			notifications.notify({
				title: 'Epic Redeem Failed',
				message: 'An error occurred during redeeming. Check logs for details',
				level: 'error'
			});
		}

		insertHistoryHelper(
			EPIC_STORE_ID,
			'Redeem Failed',
			'An error occurred during redeeming. Check logs for details',
			'failure',
			log
		);

		return false;
	} finally {
		setReddeemingStore({ id: EPIC_STORE_ID, redeeming: false });
		await closeCtx(ctx);
	}
});
