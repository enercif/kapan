CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`cron` text DEFAULT '0 9 * * *' NOT NULL,
	`login` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT false NOT NULL
);
