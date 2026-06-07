import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const storeTable = sqliteTable('stores', {
	id: text('id', { enum: ['steam', 'epic'] }).primaryKey(),
	cron: text('cron').default('0 9 * * *').notNull(),
	login: integer('login', { mode: 'boolean' }).default(false).notNull(),
	active: integer('active', { mode: 'boolean' }).default(false).notNull()
});

export const settingsTable = sqliteTable('settings', {
	id: integer('id').primaryKey(),

	ntfy_topic: text('ntfy_topic'),
	ntfy_server_url: text('ntfy_server_url'),
	ntfy_token: text('ntfy_token'),
	ntfy_enabled: integer('ntfy_enabled', { mode: 'boolean' }).default(false).notNull(),

	telegram_chat_id: text('telegram_chat_id'),
	telegram_bot_token: text('telegram_bot_token'),
	telegram_enabled: integer('telegram_enabled', { mode: 'boolean' }).default(false).notNull()
});

export const notificationsTable = sqliteTable('notifications', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title').notNull(),
	message: text('message').notNull(),
	level: text('level').notNull(),
	status: text('status').notNull(),
	provider: text('provider').notNull(),
	created_at: text('created_at').notNull()
});

export const historyTable = sqliteTable('history', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	store: text('store').notNull(),
	header: text('header').notNull(),
	body: text('body').notNull(),
	status: text('status').notNull(),
	created_at: text('created_at').notNull()
});
