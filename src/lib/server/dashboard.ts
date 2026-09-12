import { readHistory } from './history';
import { live } from './live';
import { readNotifications } from './notifications/log';
import { readStores } from './stores';

export const dashboardStream = live(async () => ({
	stores: await readStores(),
	history: await readHistory(),
	notifications: await readNotifications()
}));
