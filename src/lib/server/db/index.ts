import { DATABASE_URL } from '$env/static/private';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

if (!DATABASE_URL) throw new Error('DATABASE_URL is not set (drizzle connection string)');

const client = new Database(DATABASE_URL);

export const db = drizzle(client, { schema });
