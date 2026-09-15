import { EPIC_STORE_ID } from '$lib/const/store-ids';
import type { LoginLog, RedeemLog } from '$lib/types/log.type';
import { errorMessage } from '$lib/utils';
import type { Page } from 'playwright';
import { closeCtx, openCtx } from './browser/browser';
import { insertHistoryHelper } from './history';
import { notifications } from './notifications/registry';
import { loginStore, setLoggingStore, setReddeemingStore } from './stores';

const URL_REDEEM =
	'https://store.epicgames.com/browse?sortBy=currentPrice&sortDir=ASC&priceTier=tierDiscouted&category=Game&count=40';
const URL_LOGIN = 'https://www.epicgames.com/id/login?lang=en';
const URL_ACCOUNT = 'https://accounts.epicgames.com/account/personal';

export async function loginEpic() {
	await setLoggingStore({ id: EPIC_STORE_ID, logging: true });

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

		await insertHistoryHelper(
			EPIC_STORE_ID,
			'Epic Games Login',
			'Login successful',
			'success',
			log
		);
		await loginStore(EPIC_STORE_ID);
	} catch (error) {
		log.error = errorMessage(error);
		await insertHistoryHelper(
			EPIC_STORE_ID,
			'Epic Games Login',
			'An error occurred during login. Check logs for details',
			'failure',
			log
		);
	} finally {
		await setLoggingStore({ id: EPIC_STORE_ID, logging: false });
		await closeCtx(ctx);
	}
}

type Point = { x: number; y: number };

async function findButton(page: Page, needle: string): Promise<Point | null> {
	return page.evaluate((text) => {
		const walk = (doc: Document, ox: number, oy: number): Point | null => {
			const view = doc.defaultView;
			if (!view) return null;
			const label = (b: Element) => (b.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();

			const hits = [...doc.querySelectorAll('button')].filter((b) => {
				const r = b.getBoundingClientRect();
				const cs = view.getComputedStyle(b);
				return (
					!b.disabled &&
					r.width > 0 &&
					r.height > 0 &&
					cs.visibility !== 'hidden' &&
					cs.display !== 'none' &&
					label(b).includes(text)
				);
			});
			const btn = hits.find((b) => label(b) === text) ?? hits[0];

			if (btn) {
				btn.scrollIntoView({ block: 'center' });
				const r = btn.getBoundingClientRect();
				const left = Math.max(r.left, 1);
				const right = Math.min(r.right, view.innerWidth - 1);
				const top = Math.max(r.top, 1);
				const bottom = Math.min(r.bottom, view.innerHeight - 1);
				if (right <= left || bottom <= top) return null;
				const x = left + (right - left) / 2;
				const y = top + (bottom - top) / 2;
				const onTop = doc.elementFromPoint(x, y);
				if (!onTop || (onTop !== btn && !btn.contains(onTop))) return null;
				return { x: ox + x, y: oy + y };
			}

			for (const f of [...doc.querySelectorAll('iframe')]) {
				try {
					const inner = f.contentDocument;
					if (!inner) continue;
					const r = f.getBoundingClientRect();
					const found = walk(inner, ox + r.left, oy + r.top);
					if (found) return found;
				} catch {}
			}
			return null;
		};
		return walk(document, 0, 0);
	}, needle);
}

async function clickButton(page: Page, needle: string, timeoutMs = 30_000): Promise<boolean> {
	const deadline = Date.now() + timeoutMs;
	for (;;) {
		const at = await findButton(page, needle);
		if (at) {
			await page.mouse.move(at.x, at.y);
			await page.mouse.click(at.x, at.y, { delay: 11 });
			return true;
		}
		if (Date.now() > deadline) return false;
		await page.waitForTimeout(250);
	}
}

async function talonVisible(page: Page): Promise<boolean> {
	return page.evaluate(() => {
		const walk = (doc: Document): boolean => {
			const el = doc.querySelector<HTMLElement>('[id^="talon_container_"]');
			if (el && doc.defaultView?.getComputedStyle(el).visibility !== 'hidden') return true;
			for (const f of [...doc.querySelectorAll('iframe')]) {
				try {
					if (f.contentDocument && walk(f.contentDocument)) return true;
				} catch {}
			}
			return false;
		};
		return walk(document);
	});
}

export async function redeemEpic(manual: boolean): Promise<boolean> {
	await setReddeemingStore({ id: EPIC_STORE_ID, redeeming: true });
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
		const reason = async (fallback: string) =>
			(await talonVisible(page)) ? 'blocked by Epic security check (Talon/hCaptcha)' : fallback;

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

				await page.waitForLoadState('networkidle');

				if (!(await clickButton(page, 'add to library'))) {
					throw new Error(await reason('"Add to library" never appeared'));
				}

				await clickButton(page, 'i accept', 3_000);

				try {
					await page.waitForSelector('text=final step', { timeout: 30_000 });
				} catch {
					throw new Error(await reason('order not confirmed (no "final step")'));
				}

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

		await insertHistoryHelper(
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

		await insertHistoryHelper(
			EPIC_STORE_ID,
			'Redeem Failed',
			'An error occurred during redeeming. Check logs for details',
			'failure',
			log
		);

		return false;
	} finally {
		await setReddeemingStore({ id: EPIC_STORE_ID, redeeming: false });
		await closeCtx(ctx);
	}
}
