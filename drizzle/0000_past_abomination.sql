CREATE TABLE `history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`store` text NOT NULL,
	`header` text NOT NULL,
	`body` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`level` text NOT NULL,
	`status` text NOT NULL,
	`provider` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`ntfy_topic` text DEFAULT '' NOT NULL,
	`ntfy_server_url` text DEFAULT '' NOT NULL,
	`ntfy_token` text DEFAULT '' NOT NULL,
	`ntfy_enabled` integer DEFAULT false NOT NULL,
	`telegram_chat_id` text DEFAULT '' NOT NULL,
	`telegram_bot_token` text DEFAULT '' NOT NULL,
	`telegram_enabled` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`cron` text DEFAULT '0 9 * * *' NOT NULL,
	`login` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT false NOT NULL
);

