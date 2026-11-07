CREATE TABLE `email_watchlist` (
	`id` integer PRIMARY KEY NOT NULL,
	`ids_json` text DEFAULT '[]' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_at` text,
	`updated_by` text
);
