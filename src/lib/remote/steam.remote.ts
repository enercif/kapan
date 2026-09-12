import { command } from '$app/server';
import { loginSteam as login, redeemSteam as redeem } from '$lib/server/steam';
import z from 'zod';

export const loginSteam = command(login);
export const redeemSteam = command(z.boolean(), redeem);
