import { EPIC_STORE_ID } from '$lib/const/store-ids';
import type { LoginLog, RedeemLog } from '$lib/types/log.type';
import { errorMessage } from '$lib/utils';
import { closeCtx, openCtx } from './browser/browser';
import { insertHistoryHelper } from './history';
import { notifications } from './notifications/registry';
import { loginStore, setLoggingStore, setReddeemingStore } from './stores';

const URL_REDEEM =
	'https://store.epicgames.com/browse?sortBy=currentPrice&sortDir=ASC&priceTier=tierDiscouted&category=Game&count=40';
const URL_LOGIN = 'https://www.epicgames.com/id/login?lang=en';
const URL_ACCOUNT = 'https://accounts.epicgames.com/account/personal';

export async function loginEpic() {
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
		log.error = errorMessage(error);
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
}

export async function redeemEpic(manual: boolean): Promise<boolean> {
	setReddeemingStore({ id: EPIC_STORE_ID, redeeming: true });
	let log: RedeemLog = {
		type: 'redeem',
		foundLinks: [],
		error: undefined,
		processedGames: []
	};
	const ctx = await openCtx(EPIC_STORE_ID);
	let redeemedGames: string[] = [];
	let failedGames: string[] = [];

	try {
		const page = await ctx.newPage();

		await page.goto(URL_REDEEM, { waitUntil: 'domcontentloaded' });
		await page.waitForSelector('a:has(span:text("-100%"))', { timeout: 15_000 }).catch(() => {});

		const links = await page
			.locator('a:has(span:text("-100%"))')
			.evaluateAll((anchors) => (anchors as HTMLAnchorElement[]).map((a) => a.href));

		log.foundLinks = links;

		for (const link of links) {
			let title = link;

			try {
				await page.goto(link, { waitUntil: 'domcontentloaded' });

				title =
					(await page.locator('[data-testid="pdp-title"]').first().textContent()) ||
					'Unknown Title';

				const purchaseBtn = page
					.locator('button[data-testid="purchase-cta-button"]')
					.filter({ hasText: /\S/ });
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

				const iframe = page.frameLocator('#webPurchaseContainer iframe');

				const libraryButton = iframe.locator('button:has(span:text("Add to library"))').first();
				await libraryButton.waitFor({ timeout: 30_000 });
				await libraryButton.click({ delay: 11 });

				try {
					const acceptButton = iframe.locator('button:has-text("I accept")').first();
					await acceptButton.waitFor({ timeout: 30_000 });
					await acceptButton.click({ delay: 11 });
				} catch {}

				await page.waitForSelector('text=final step', { timeout: 30_000 });

				redeemedGames.push(title);
				log.processedGames.push({
					title,
					status: 'redeemed'
				});
			} catch (error) {
				failedGames.push(title);
				log.processedGames.push({
					title,
					status: 'failed'
				});
				log.error = [log.error, `${title}: ${errorMessage(error)}`].filter(Boolean).join('\n\n');
			}
		}

		const bodyLines = [...redeemedGames];
		if (failedGames.length > 0) bodyLines.push(`Failed: ${failedGames.join(', ')}`);
		const body = bodyLines.length
			? bodyLines.join('\n')
			: links.length === 0
				? 'No free games found'
				: 'No new games redeemed';
		const failed = failedGames.length > 0;

		if (!manual && bodyLines.length > 0) {
			notifications.notify({
				title: failed ? 'Epic Redeem Incomplete' : 'Epic Redeem Complete',
				message: body,
				level: failed ? 'error' : 'info'
			});
		}

		insertHistoryHelper(
			EPIC_STORE_ID,
			failed ? 'Redeem Incomplete' : 'Redeem Complete',
			body,
			failed ? 'failure' : 'success',
			log
		);

		return !failed;
	} catch (error) {
		log.error = errorMessage(error);

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
}
