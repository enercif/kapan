import { command } from '$app/server';
import { STEAM_STORE_ID } from '$lib/const/store-ids';
import { closeCtx, openCtx } from '$lib/server/browser/browser';
import type { History } from '$lib/types/history.type';
import { insertHistoryHelper } from '$lib/utils';

const URL_LOGIN = 'https://store.steampowered.com/login/?redir=%3Fl%3Denglish&redir_ssl=1';
const URL_BASE = 'https://store.steampowered.com/?l=english';
const URL_REDEEM = 'https://store.steampowered.com/search/?maxprice=free&specials=1&ndl=1';

export const loginSteam = command(async () => {
	const ctx = await openCtx(STEAM_STORE_ID);

	try {
		const page = ctx.pages().length ? ctx.pages()[0] : await ctx.newPage();
		await page.goto(URL_LOGIN, { waitUntil: 'domcontentloaded' });
		await page.waitForURL(URL_BASE, { timeout: 120_000 });
		return true;
	} catch (error) {
		console.error('Error during Steam login:', error);
		return false;
	} finally {
		await closeCtx(ctx);
	}
});

export const redeemSteam = command(async (): Promise<History> => {
	const ctx = await openCtx(STEAM_STORE_ID);

	let redeemedGames: string[] = [];

	try {
		const page = ctx.pages().length ? ctx.pages()[0] : await ctx.newPage();
		await page.goto(URL_REDEEM, { waitUntil: 'domcontentloaded' });
		await page.waitForSelector('a:has(div.discount_pct:text("-100%"))', { timeout: 15_000 });

		const links = await page
			.locator('a:has(div.discount_pct:text("-100%"))')
			.evaluateAll((anchors) => (anchors as HTMLAnchorElement[]).map((a) => a.href));

		for (const link of links) {
			console.log('Processing:', link);
			await page.goto(link, { waitUntil: 'domcontentloaded' });

			try {
				const ageSelect = page.locator('select#ageYear').first();
				await ageSelect.waitFor({ timeout: 3_000 });
				await ageSelect.selectOption('2000');

				const viewPageAnchor = page.locator('a:has(span:text("View Page"))').first();
				await viewPageAnchor.waitFor({ timeout: 5_000 });
				await viewPageAnchor.dispatchEvent('click');
			} catch {
				console.log('No age verification for:', link);
			}

			const addToAccountAnchor = page.locator('a:has(span:text("Add to Account"))').first();
			const playGameAnchor = page.locator('a:has(span:text("Play Game"))').first();

			const found = await Promise.race([
				addToAccountAnchor.waitFor({ timeout: 30_000 }).then(() => 'add-to-account'),
				playGameAnchor.waitFor({ timeout: 30_000 }).then(() => 'play-game')
			]);

			if (found === 'play-game') {
				console.log('Already in library, skipping:', link);
				continue;
			}

			await page.waitForTimeout(2000);
			await addToAccountAnchor.dispatchEvent('click');
			await page.waitForTimeout(2000);
			redeemedGames.push(link);
		}

		return insertHistoryHelper(
			STEAM_STORE_ID,
			'Redeem Complete',
			redeemedGames.length === 0 ? 'No new games redeemed' : redeemedGames.join('\n'),
			'success'
		);
	} catch (error) {
		console.error('Error during Steam redeem:', error);

		return insertHistoryHelper(
			STEAM_STORE_ID,
			'Redeem Failed',
			error instanceof Error ? error.message : 'Unknown error',
			'failure'
		);
	} finally {
		await closeCtx(ctx);
	}
});
