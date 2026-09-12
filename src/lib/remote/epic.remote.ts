import { command } from '$app/server';
import { loginEpic as login, redeemEpic as redeem } from '$lib/server/epic';
import z from 'zod';

export const loginEpic = command(login);
export const redeemEpic = command(z.boolean(), redeem);
