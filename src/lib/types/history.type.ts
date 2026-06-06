import type { Status } from './status.type';

type HistoryBase = {
	store: string;
	header: string;
	body: string;
	created_at: string;
};

export type History = HistoryBase & {
	id: number;
	status: string;
};

export type HistoryInsert = HistoryBase & {
	status: Status;
};
