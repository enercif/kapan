export type RedeemLog = {
	type: 'redeem';
	foundLinks: string[];
	error: string | undefined;
	processedGames: {
		title: string;
		status: 'redeemed' | 'already_in_library' | 'failed';
	}[];
};

export type LoginLog = {
	type: 'login';
	error: string | undefined;
};

export type LogEntry = RedeemLog | LoginLog;
