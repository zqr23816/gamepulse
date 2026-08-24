CREATE TABLE `game_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`player_id` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `idempotency_keys` (
	`key` text PRIMARY KEY NOT NULL,
	`response_body` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_idempotency_key` ON `idempotency_keys` (`key`);--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`winner_id` text NOT NULL,
	`loser_id` text NOT NULL,
	`winner_delta` integer NOT NULL,
	`loser_delta` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`rating` integer DEFAULT 1000 NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);

