import { command } from '$app/server';
import { STEAM_STORE_ID } from '$lib/const/store-ids';
import { closeCtx, openCtx } from '$lib/server/browser/browser';
import { notifications } from '$lib/server/notifications/registry';
import type { History } from '$lib/types/history.type';
import type { LoginLog, RedeemLog } from '$lib/types/log.type';
import { insertHistoryHelper } from '$lib/utils';

const URL_LOGIN = 'https://store.steampowered.com/login/?redir=%3Fl%3Denglish&redir_ssl=1';
const URL_BASE = 'https://store.steampowered.com/?l=english';
const URL_REDEEM = 'https://store.steampowered.com/search/?maxprice=free&specials=1&ndl=1';

export const loginSteam = command(async () => {
	let log: LoginLog = {
		type: 'login',
		error: undefined
	};
	const ctx = await openCtx(STEAM_STORE_ID);

	try {
		const page = ctx.pages().length ? ctx.pages()[0] : await ctx.newPage();
		await page.goto(URL_LOGIN, { waitUntil: 'domcontentloaded' });
		await page.waitForURL(URL_BASE, { timeout: 120_000 });
		const history = await insertHistoryHelper(
			STEAM_STORE_ID,
			'Steam Login',
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
			STEAM_STORE_ID,
			'Steam Login',
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

export const redeemSteam = command(async (): Promise<History> => {
	let log: RedeemLog = {
		type: 'redeem',
		foundLinks: [],
		error: undefined,
		processedGames: []
	};
	const ctx = await openCtx(STEAM_STORE_ID);
	let redeemedGames: string[] = [];

	try {
		const page = ctx.pages().length ? ctx.pages()[0] : await ctx.newPage();
		await page.goto(URL_REDEEM, { waitUntil: 'domcontentloaded' });
		await page.waitForSelector('a:has(div.discount_pct:text("-100%"))', { timeout: 15_000 });

		const links = await page
			.locator('a:has(div.discount_pct:text("-100%"))')
			.evaluateAll((anchors) => (anchors as HTMLAnchorElement[]).map((a) => a.href));
		log.foundLinks = links;

		for (const link of links) {
			await page.goto(link, { waitUntil: 'domcontentloaded' });

			try {
				const ageSelect = page.locator('select#ageYear').first();
				await ageSelect.waitFor({ timeout: 3_000 });
				await ageSelect.selectOption('2000');

				const viewPageAnchor = page.locator('a:has(span:text("View Page"))').first();
				await viewPageAnchor.waitFor({ timeout: 5_000 });
				await viewPageAnchor.dispatchEvent('click');
			} catch {}

			const title =
				(await page.locator('div.apphub_AppName[role="heading"]').textContent()) || 'Unknown Title';

			const addToAccountAnchor = page.locator('a:has(span:text("Add to Account"))').first();
			const playGameAnchor = page.locator('a:has(span:text("Play Game"))').first();

			const found = await Promise.race([
				addToAccountAnchor.waitFor({ timeout: 30_000 }).then(() => 'add-to-account'),
				playGameAnchor.waitFor({ timeout: 30_000 }).then(() => 'play-game')
			]);

			if (found === 'play-game') {
				log.processedGames.push({
					title,
					status: 'already_in_library'
				});
				continue;
			}

			await page.waitForTimeout(2000);
			await addToAccountAnchor.dispatchEvent('click');
			await page.waitForTimeout(2000);

			redeemedGames.push(title);
			log.processedGames.push({
				title,
				status: 'redeemed'
			});
		}

		if (redeemedGames.length > 0) {
			notifications.notify({
				title: 'Steam Redeem Complete',
				message: redeemedGames.join('\n'),
				level: 'info'
			});
		}

		return insertHistoryHelper(
			STEAM_STORE_ID,
			'Redeem Complete',
			redeemedGames.length === 0 ? 'No new games redeemed' : redeemedGames.join('\n'),
			'success',
			log
		);
	} catch (error) {
		log.error = error instanceof Error ? error.message : 'Unknown error';

		notifications.notify({
			title: 'Steam Redeem Failed',
			message: 'An error occurred during redeeming. Check logs for details',
			level: 'error'
		});

		return insertHistoryHelper(
			STEAM_STORE_ID,
			'Redeem Failed',
			'An error occurred during redeeming. Check logs for details',
			'failure',
			log
		);
	} finally {
		await closeCtx(ctx);
	}
});
