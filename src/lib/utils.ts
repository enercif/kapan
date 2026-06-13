import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { STORE_NAMES } from './const/maps';
import { insertHistory } from './remote/history.remote';
import type { HistoryInsert } from './types/history.type';
import type { LogEntry } from './types/log.type';
import type { Status } from './types/status.type';
import type { StoreID } from './types/store-id.type';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleString();
}

export async function insertHistoryHelper(
	storeId: StoreID,
	header: string,
	body: string,
	status: Status,
	log: LogEntry
) {
	const historyInsert: HistoryInsert = {
		status: status,
		store: STORE_NAMES[storeId],
		header: header,
		body: body,
		log: JSON.stringify(log),
		created_at: new Date().toISOString()
	};
	await insertHistory(historyInsert);
}
