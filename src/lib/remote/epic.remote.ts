import { command } from '$app/server';
import { EPIC_STORE_ID } from '$lib/const/store-ids';
import { closeCtx, openCtx } from '$lib/server/browser/browser';
import { notifications } from '$lib/server/notifications/registry';
import type { History } from '$lib/types/history.type';
import type { LoginLog, RedeemLog } from '$lib/types/log.type';
import { EMPTY_LOGIN_LOG, EMPTY_REDEEM_LOG, insertHistoryHelper } from '$lib/utils';

const URL_REDEEM =
	'https://store.epicgames.com/browse?sortBy=currentPrice&sortDir=ASC&priceTier=tierDiscouted&category=Game&count=40';
const URL_LOGIN = 'https://www.epicgames.com/id/login?lang=en';
const URL_ACCOUNT = 'https://accounts.epicgames.com/account/personal';

export const loginEpic = command(async () => {
	let log: LoginLog = EMPTY_LOGIN_LOG;
	const ctx = await openCtx(EPIC_STORE_ID);

	try {
		const page = ctx.pages().length ? ctx.pages()[0] : await ctx.newPage();
		await page.goto(URL_LOGIN, { waitUntil: 'domcontentloaded' });
		await page.waitForURL(URL_ACCOUNT, { timeout: 120_000 });

		const history = await insertHistoryHelper(
			EPIC_STORE_ID,
			'Epic Games Login',
			'Login successful',
			'success',
			log
		);

		return {
			history,
			success: true
		};
	} catch (error) {
		log.error = error instanceof Error ? error.message : 'Unknown error';
		const history = await insertHistoryHelper(
			EPIC_STORE_ID,
			'Epic Games Login',
			'An error occurred during login. Check logs for details',
			'failure',
			log
		);

		return {
			history,
			success: false
		};
	} finally {
		await closeCtx(ctx);
	}
});

export const redeemEpic = command(async (): Promise<History> => {
	let log: RedeemLog = EMPTY_REDEEM_LOG;
	const ctx = await openCtx(EPIC_STORE_ID);
	let redeemedGames: string[] = [];

	try {
		const page = ctx.pages().length ? ctx.pages()[0] : await ctx.newPage();
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

			const getButton = page.locator('button span span:text("Get")').first();
			const inLibraryButton = page.locator('button span span:text("In Library")').first();

			const found = await Promise.race([
				getButton.waitFor({ timeout: 30_000 }).then(() => 'get'),
				inLibraryButton.waitFor({ timeout: 30_000 }).then(() => 'in-library')
			]);

			if (found === 'in-library') {
				log.processedGames.push({
					title,
					status: 'already_in_library'
				});
				continue;
			}
			await getButton.click({ delay: 1000 });

			try {
				const continueButton = page.locator('button span span:text("Continue")').first();
				await continueButton.waitFor({ timeout: 30_000 });
				await continueButton.click({ delay: 1000 });
			} catch {}

			await page.waitForSelector('#webPurchaseContainer iframe');
			const iframe = page.frameLocator('#webPurchaseContainer iframe');

			const libraryButton = iframe.locator('button:has(span:text("Add to library"))').first();
			await libraryButton.waitFor({ timeout: 30_000 });
			await libraryButton.click();

			try {
				const acceptButton = iframe.locator('button:has-text("I accept")');
				await acceptButton.waitFor({ timeout: 30_000 });
				await acceptButton.click({ delay: 1000 });
			} catch {}

			await page.waitForSelector('h3:has(span:text("Download the Epic Games Launcher to play"))', {
				timeout: 30_000
			});

			redeemedGames.push(title);
			log.processedGames.push({
				title,
				status: 'redeemed'
			});
		}

		if (redeemedGames.length > 0) {
			notifications.notify({
				title: 'Epic Redeem Complete',
				message: redeemedGames.join('\n'),
				level: 'info'
			});
		}

		return insertHistoryHelper(
			EPIC_STORE_ID,
			'Redeem Complete',
			redeemedGames.length === 0 ? 'No new games redeemed' : redeemedGames.join('\n'),
			'success',
			log
		);
	} catch (error) {
		log.error = error instanceof Error ? error.message : 'Unknown error';

		notifications.notify({
			title: 'Epic Redeem Failed',
			message: 'An error occurred during redeeming. Check logs for details',
			level: 'error'
		});

		return insertHistoryHelper(
			EPIC_STORE_ID,
			'Redeem Failed',
			'An error occurred during redeeming. Check logs for details',
			'failure',
			log
		);
	} finally {
		await closeCtx(ctx);
	}
});
