import { query } from '$app/server';
import { dashboardStream } from '$lib/server/dashboard';

export const selectDashboard = query.live(dashboardStream);
