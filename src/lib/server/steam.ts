import { STEAM_STORE_ID } from '$lib/const/store-ids';
import type { LoginLog, RedeemLog } from '$lib/types/log.type';
import { closeCtx, openCtx } from './browser/browser';
import { insertHistoryHelper } from './history';
import { notifications } from './notifications/registry';
import { loginStore, setLoggingStore, setReddeemingStore } from './stores';

const URL_LOGIN = 'https://store.steampowered.com/login/?redir=%3Fl%3Denglish&redir_ssl=1';
const URL_BASE = 'https://store.steampowered.com/?l=english';
const URL_REDEEM = 'https://store.steampowered.com/search/?maxprice=free&specials=1&ndl=1';

export async function loginSteam() {
	setLoggingStore({ id: STEAM_STORE_ID, logging: true });
	let log: LoginLog = {
		type: 'login',
		error: undefined
	};
	const ctx = await openCtx(STEAM_STORE_ID);

	try {
		const page = await ctx.newPage();
		await page.waitForTimeout(2000);
		await page.goto(URL_LOGIN, { waitUntil: 'domcontentloaded' });
		await page.waitForURL(URL_BASE, { timeout: 240_000 });

		insertHistoryHelper(STEAM_STORE_ID, 'Steam Login', 'Login successful', 'success', log);
		loginStore(STEAM_STORE_ID);
	} catch (error) {
		log.error = error instanceof Error ? error.message : 'Unknown error';
		insertHistoryHelper(
			STEAM_STORE_ID,
			'Steam Login',
			'An error occurred during login. Check logs for details',
			'failure',
			log
		);
	} finally {
		setLoggingStore({ id: STEAM_STORE_ID, logging: false });
		await closeCtx(ctx);
	}
}

export async function redeemSteam(manual: boolean): Promise<boolean> {
	setReddeemingStore({ id: STEAM_STORE_ID, redeeming: true });

	let log: RedeemLog = {
		type: 'redeem',
		foundLinks: [],
		error: undefined,
		processedGames: []
	};
	const ctx = await openCtx(STEAM_STORE_ID);
	let redeemedGames: string[] = [];

	try {
		const page = await ctx.newPage();
		await page.goto(URL_REDEEM, { waitUntil: 'domcontentloaded' });
		await page
			.waitForSelector('a:has(div.discount_pct:text("-100%"))', { timeout: 15_000 })
			.catch(() => {});

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

		if (redeemedGames.length > 0 && !manual) {
			notifications.notify({
				title: 'Steam Redeem Complete',
				message: redeemedGames.join('\n'),
				level: 'info'
			});
		}

		insertHistoryHelper(
			STEAM_STORE_ID,
			'Redeem Complete',
			links.length === 0
				? 'No free games found'
				: redeemedGames.length === 0
					? 'No new games redeemed'
					: redeemedGames.join('\n'),
			'success',
			log
		);

		return true;
	} catch (error) {
		log.error = error instanceof Error ? error.message : 'Unknown error';

		if (!manual) {
			notifications.notify({
				title: 'Steam Redeem Failed',
				message: 'An error occurred during redeeming. Check logs for details',
				level: 'error'
			});
		}

		insertHistoryHelper(
			STEAM_STORE_ID,
			'Redeem Failed',
			'An error occurred during redeeming. Check logs for details',
			'failure',
			log
		);

		return false;
	} finally {
		setReddeemingStore({ id: STEAM_STORE_ID, redeeming: false });
		await closeCtx(ctx);
	}
}
