import { command } from '$app/server';
import { EPIC_STORE_ID } from '$lib/const/store-ids';
import { closeCtx, openCtx } from '$lib/server/browser/browser';
import type { History } from '$lib/types/history.type';
import { insertHistoryHelper } from '$lib/utils';

const URL_REDEEM =
	'https://store.epicgames.com/browse?sortBy=currentPrice&sortDir=ASC&priceTier=tierDiscouted&category=Game&count=40';
const URL_LOGIN = 'https://www.epicgames.com/id/login?lang=en';
const URL_ACCOUNT = 'https://accounts.epicgames.com/account/personal';

export const loginEpic = command(async () => {
	const ctx = await openCtx(EPIC_STORE_ID);

	try {
		const page = ctx.pages().length ? ctx.pages()[0] : await ctx.newPage();
		await page.goto(URL_LOGIN, { waitUntil: 'domcontentloaded' });
		await page.waitForURL(URL_ACCOUNT, { timeout: 120_000 });
		return true;
	} catch (error) {
		console.error('Error during Epic login:', error);
		return false;
	} finally {
		await closeCtx(ctx);
	}
});

export const redeemEpic = command(async (): Promise<History> => {
	const ctx = await openCtx(EPIC_STORE_ID);

	let redeemedGames: string[] = [];

	try {
		const page = ctx.pages().length ? ctx.pages()[0] : await ctx.newPage();
		await page.goto(URL_REDEEM, { waitUntil: 'domcontentloaded' });
		await page.waitForSelector('a:has(span:text("-100%"))', { timeout: 15_000 });

		const links = await page
			.locator('a:has(span:text("-100%"))')
			.evaluateAll((anchors) => (anchors as HTMLAnchorElement[]).map((a) => a.href));

		for (const link of links) {
			console.log('Processing:', link);
			await page.goto(link, { waitUntil: 'domcontentloaded' });

			const getButton = page.locator('button span span:text("Get")').first();
			const inLibraryButton = page.locator('button span span:text("In Library")').first();

			const found = await Promise.race([
				getButton.waitFor({ timeout: 30_000 }).then(() => 'get'),
				inLibraryButton.waitFor({ timeout: 30_000 }).then(() => 'in-library')
			]);

			if (found === 'in-library') {
				console.log('Already in library, skipping:', link);
				continue;
			}
			await getButton.click({ delay: 1000 });

			try {
				const continueButton = page.locator('button span span:text("Continue")').first();
				await continueButton.waitFor({ timeout: 30_000 });
				await continueButton.click({ delay: 1000 });
			} catch {
				console.log('No "Continue" dialog for:', link);
			}

			await page.waitForSelector('#webPurchaseContainer iframe');
			const iframe = page.frameLocator('#webPurchaseContainer iframe');

			const libraryButton = iframe.locator('button:has(span:text("Add to library"))').first();
			await libraryButton.waitFor({ timeout: 30_000 });
			await libraryButton.click();

			try {
				const acceptButton = iframe.locator('button:has-text("I accept")');
				await acceptButton.waitFor({ timeout: 30_000 });
				await acceptButton.click({ delay: 1000 });
			} catch {
				console.log('No "Accept Terms" dialog for:', link);
			}

			await page.waitForTimeout(30000);
			redeemedGames.push(link);
			console.log('Redeemed:', link);
		}

		return insertHistoryHelper(
			EPIC_STORE_ID,
			'Redeem Complete',
			redeemedGames.length === 0 ? 'No new games redeemed' : redeemedGames.join('\n'),
			'success'
		);
	} catch (error) {
		console.error('Error during Epic redeem:', error);
		return insertHistoryHelper(
			EPIC_STORE_ID,
			'Redeem Failed',
			error instanceof Error ? error.message : 'Unknown error',
			'failure'
		);
	} finally {
		await closeCtx(ctx);
	}
});
