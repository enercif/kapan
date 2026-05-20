import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const storeTable = sqliteTable('stores', {
	id: text('id', { enum: ['steam', 'epic'] }).primaryKey(),
	cron: text('cron').default('0 9 * * *').notNull(),
	login: integer('login', { mode: 'boolean' }).default(false).notNull(),
	active: integer('active', { mode: 'boolean' }).default(false).notNull()
});
