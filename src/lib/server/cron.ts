import { EPIC_STORE_ID, STEAM_STORE_ID } from '$lib/const/store-ids';
import { redeemEpic } from '$lib/remote/epic.remote';
import { redeemSteam } from '$lib/remote/steam.remote';
import type { StoreID } from '$lib/types/store-id.type';
import { CronJob } from 'cron';

export const CRON_MAP: Map<StoreID, CronJob> = new Map();

export function stopCron(storeId: StoreID) {
	CRON_MAP.get(storeId)?.stop();
	CRON_MAP.delete(storeId);
}

export function upsertCron(storeId: StoreID, cron: string) {
	CRON_MAP.get(storeId)?.stop();
	let task: () => void;

	switch (storeId) {
		case STEAM_STORE_ID:
			CRON_MAP.delete(STEAM_STORE_ID);
			task = () => redeemSteam(false);
			break;
		case EPIC_STORE_ID:
			CRON_MAP.delete(EPIC_STORE_ID);
			task = () => redeemEpic(false);
			break;
	}

	const job = new CronJob(cron, task);
	CRON_MAP.set(storeId, job);
	job.start();
}
