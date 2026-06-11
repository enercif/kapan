import { loginEpic, redeemEpic } from '$lib/remote/epic.remote';
import { loginSteam, redeemSteam } from '$lib/remote/steam.remote';
import type { History } from '$lib/types/history.type';
import type { StoreID } from '$lib/types/store-id.type';
import type { RemoteCommand } from '@sveltejs/kit';

export const STORE_NAMES: Record<StoreID, string> = {
	steam: 'Steam',
	epic: 'Epic Games'
};

export const STORE_LOGOS: Record<StoreID, string> = {
	steam: 'steam_logo.png',
	epic: 'epic_logo.png'
};

export const loginFn: Record<
	StoreID,
	RemoteCommand<void, { history: History; success: boolean }>
> = {
	steam: loginSteam,
	epic: loginEpic
};

export const redeemFn: Record<StoreID, RemoteCommand<void, History>> = {
	steam: redeemSteam,
	epic: redeemEpic
};
